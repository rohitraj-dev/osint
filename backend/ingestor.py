import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests
import websockets
from dotenv import load_dotenv
from pymongo import MongoClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / '.env'
DATABASE_NAME = 'osint_db'
AIRCRAFT_COLLECTION = 'aircraft_states'
VESSEL_COLLECTION = 'vessel_states'
AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream'
ADS_B_URL = 'https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/500'
AIS_LISTEN_SECONDS = 60
TTL_SECONDS = 43200

ADS_B_CENTERS = {
  'North Atlantic': (45, -35),
  'Europe': (50, 10),
  'US East': (38, -75),
  'US West': (38, -120),
  'Middle East': (25, 45),
  'Asia-Pacific': (25, 125),
}


def load_settings():
  load_dotenv(ENV_PATH)
  mongo_uri = os.getenv('MONGO_URI')
  ais_key = os.getenv('VITE_AISSTREAM_KEY')

  if not mongo_uri:
    raise RuntimeError('MONGO_URI is not set.')
  if not ais_key:
    raise RuntimeError('VITE_AISSTREAM_KEY is not set.')

  return mongo_uri, ais_key


def fetch_ads_b_center(center):
  response = requests.get(ADS_B_URL.format(lat=center[0], lon=center[1]), timeout=30)
  response.raise_for_status()
  return response.json().get('ac', [])


def parse_aircraft_documents(aircraft_rows, timestamp):
  documents = []

  for aircraft in aircraft_rows:
    lat = aircraft.get('lat')
    lon = aircraft.get('lon')
    if lat is None or lon is None or aircraft.get('hex') is None:
      continue

    documents.append(
      {
        'hex': aircraft.get('hex'),
        'flight': aircraft.get('flight'),
        'lat': lat,
        'lon': lon,
        'alt_baro': aircraft.get('alt_baro'),
        'gs': aircraft.get('gs'),
        'track': aircraft.get('track'),
        't': aircraft.get('t'),
        'timestamp': timestamp,
      }
    )

  return documents


async def collect_aircraft(timestamp):
  responses = await asyncio.gather(
    *(asyncio.to_thread(fetch_ads_b_center, center) for center in ADS_B_CENTERS.values())
  )
  aircraft_by_hex = {}
  for aircraft_rows in responses:
    for aircraft in aircraft_rows:
      hex_code = aircraft.get('hex')
      if hex_code:
        aircraft_by_hex[hex_code] = aircraft

  return parse_aircraft_documents(aircraft_by_hex.values(), timestamp)


async def collect_vessels(ais_key, timestamp):
  subscription = {
    'APIKey': ais_key,
    'BoundingBoxes': [[[-90, -180], [90, 180]]],
    'FilterMessageTypes': ['PositionReport'],
  }
  latest_by_mmsi = {}
  loop = asyncio.get_running_loop()
  deadline = loop.time() + AIS_LISTEN_SECONDS

  async with websockets.connect(AISSTREAM_URL) as websocket:
    await websocket.send(json.dumps(subscription))
    while True:
      remaining = deadline - loop.time()
      if remaining <= 0:
        break

      try:
        raw_message = await asyncio.wait_for(websocket.recv(), timeout=remaining)
      except asyncio.TimeoutError:
        break

      message = json.loads(raw_message)
      if message.get('MessageType') != 'PositionReport':
        continue

      position_report = message.get('Message', {}).get('PositionReport', {})
      metadata = message.get('MetaData', {})
      mmsi = metadata.get('MMSI')
      lat = position_report.get('Latitude', metadata.get('latitude'))
      lon = position_report.get('Longitude', metadata.get('longitude'))
      if mmsi is None or lat is None or lon is None:
        continue

      latest_by_mmsi[mmsi] = {
        'mmsi': mmsi,
        'name': metadata.get('ShipName'),
        'lat': lat,
        'lon': lon,
        'sog': position_report.get('Sog'),
        'cog': position_report.get('Cog'),
        'timestamp': timestamp,
      }

  return list(latest_by_mmsi.values())


def ensure_indexes(database):
  for collection_name in (AIRCRAFT_COLLECTION, VESSEL_COLLECTION):
    collection = database[collection_name]
    collection.create_index(
      [('timestamp', 1)],
      name='timestamp_ttl',
      expireAfterSeconds=TTL_SECONDS,
    )
    collection.create_index([('timestamp', 1)], name='timestamp_idx')


def insert_documents(database, aircraft_documents, vessel_documents):
  ensure_indexes(database)
  aircraft_count = 0
  vessel_count = 0

  if aircraft_documents:
    result = database[AIRCRAFT_COLLECTION].insert_many(aircraft_documents)
    aircraft_count = len(result.inserted_ids)
  if vessel_documents:
    result = database[VESSEL_COLLECTION].insert_many(vessel_documents)
    vessel_count = len(result.inserted_ids)

  return aircraft_count, vessel_count


async def main():
  mongo_uri, ais_key = load_settings()
  timestamp = datetime.now(timezone.utc)
  client = MongoClient(mongo_uri)

  try:
    database = client[DATABASE_NAME]
    aircraft_documents, vessel_documents = await asyncio.gather(
      collect_aircraft(timestamp),
      collect_vessels(ais_key, timestamp),
    )
    aircraft_count, vessel_count = await asyncio.to_thread(
      insert_documents,
      database,
      aircraft_documents,
      vessel_documents,
    )
    print(f'Aircraft inserted: {aircraft_count} | Vessels inserted: {vessel_count}')
  finally:
    client.close()


if __name__ == '__main__':
  try:
    asyncio.run(main())
  except Exception as exc:
    print(f'Ingestion failed: {exc}')
    raise
