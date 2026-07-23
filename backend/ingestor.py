import asyncio
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import requests
import websockets
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / '.env'
OPENSKY_URL = 'https://opensky-network.org/api/states/all'
AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream'
POLL_INTERVAL_SECONDS = 60
AIS_RECONNECT_DELAY_SECONDS = 5


@dataclass
class StatusTracker:
  vessel_count: int = 0
  lock: asyncio.Lock = None

  def __post_init__(self):
    self.lock = asyncio.Lock()

  async def add_vessels(self, count):
    async with self.lock:
      self.vessel_count += count

  async def report_cycle(self, aircraft_count):
    async with self.lock:
      vessel_count = self.vessel_count
      self.vessel_count = 0

    timestamp = datetime.now(timezone.utc).strftime('%H:%M:%S')
    print(f'[{timestamp}] Aircraft: {aircraft_count} inserted | Vessels: {vessel_count} inserted')


def load_settings():
  load_dotenv(ENV_PATH)
  mongo_uri = os.getenv('MONGO_URI')
  ais_key = os.getenv('VITE_AISSTREAM_KEY')

  if not mongo_uri:
    raise RuntimeError('MONGO_URI is not set in the project root .env file.')

  if not ais_key:
    raise RuntimeError('VITE_AISSTREAM_KEY is not set in the project root .env file.')

  return mongo_uri, ais_key


def parse_aircraft_rows(rows, timestamp):
  documents = []

  for state in rows or []:
    lon = state[5]
    lat = state[6]

    if lat is None or lon is None:
      continue

    documents.append(
      {
        'icao24': state[0],
        'lat': lat,
        'lon': lon,
        'alt': state[7],
        'on_ground': state[8],
        'velocity': state[9],
        'track': state[10],
        'timestamp': timestamp,
      }
    )

  return documents


async def insert_documents(collection, documents):
  if not documents:
    return 0

  result = await collection.insert_many(documents)
  return len(result.inserted_ids)


async def poll_aircraft(collection, status):
  while True:
    timestamp = datetime.now(timezone.utc)

    try:
      response = await asyncio.to_thread(requests.get, OPENSKY_URL, timeout=30)
      response.raise_for_status()
      payload = response.json()
      documents = parse_aircraft_rows(payload.get('states'), timestamp)
      inserted_count = await insert_documents(collection, documents)
    except Exception as exc:
      inserted_count = 0
      print(f'Aircraft polling error: {exc}')

    await status.report_cycle(inserted_count)
    await asyncio.sleep(POLL_INTERVAL_SECONDS)


async def stream_vessels(collection, status, api_key):
  subscription = {
    'APIKey': api_key,
    'BoundingBoxes': [[[-90, -180], [90, 180]]],
  }

  while True:
    try:
      async with websockets.connect(AISSTREAM_URL) as websocket:
        await websocket.send(__import__('json').dumps(subscription))

        async for raw_message in websocket:
          try:
            message = __import__('json').loads(raw_message)
          except Exception:
            continue

          if message.get('MessageType') != 'PositionReport':
            continue

          position_report = message.get('Message', {}).get('PositionReport', {})
          metadata = message.get('MetaData', {})
          lat = metadata.get('latitude', position_report.get('Latitude'))
          lon = metadata.get('longitude', position_report.get('Longitude'))
          mmsi = metadata.get('MMSI')

          if mmsi is None or lat is None or lon is None:
            continue

          document = {
            'mmsi': mmsi,
            'lat': lat,
            'lon': lon,
            'speed': position_report.get('Sog'),
            'course': position_report.get('Cog'),
            'timestamp': datetime.now(timezone.utc),
          }

          inserted_count = await insert_documents(collection, [document])
          await status.add_vessels(inserted_count)
    except Exception as exc:
      print(f'AISStream connection error: {exc}')
      await asyncio.sleep(AIS_RECONNECT_DELAY_SECONDS)


async def main():
  mongo_uri, ais_key = load_settings()
  client = AsyncIOMotorClient(mongo_uri)
  database = client['osint_db']
  aircraft_collection = database['aircraft_states']
  vessel_collection = database['vessel_states']
  status = StatusTracker()

  try:
    await asyncio.gather(
      poll_aircraft(aircraft_collection, status),
      stream_vessels(vessel_collection, status, ais_key),
    )
  finally:
    client.close()


if __name__ == '__main__':
  asyncio.run(main())
