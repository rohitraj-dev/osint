# pip install scikit-learn pandas numpy pymongo python-dotenv

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / '.env'
DATABASE_NAME = 'osint_db'
AIRCRAFT_COLLECTION = 'aircraft_states'
VESSEL_COLLECTION = 'vessel_states'
ANOMALY_COLLECTION = 'anomalies'
LOOKBACK_HOURS = 2


def load_settings():
  load_dotenv(ENV_PATH)
  mongo_uri = os.getenv('MONGO_URI')

  if not mongo_uri:
    raise RuntimeError('MONGO_URI is not set in the project root .env file.')

  return mongo_uri


def load_records(collection, start_time, projection):
  return list(
    collection.find(
      {'timestamp': {'$gte': start_time}},
      projection,
    )
  )


def detect_anomalies(records, asset_type, id_field, speed_field):
  if len(records) < 10:
    return []

  frame = pd.DataFrame(records)

  required_columns = [id_field, 'lat', 'lon', speed_field, 'timestamp']
  for column in required_columns:
    if column not in frame.columns:
      return []

  frame = frame.dropna(subset=['lat', 'lon', speed_field]).copy()
  if len(frame) < 10:
    return []

  frame['lat'] = pd.to_numeric(frame['lat'], errors='coerce')
  frame['lon'] = pd.to_numeric(frame['lon'], errors='coerce')
  frame[speed_field] = pd.to_numeric(frame[speed_field], errors='coerce')
  frame = frame.dropna(subset=['lat', 'lon', speed_field]).copy()
  if len(frame) < 10:
    return []

  feature_matrix = frame[['lat', 'lon', speed_field]].to_numpy(dtype=float)
  spatial_matrix = frame[['lat', 'lon']].to_numpy(dtype=float)

  isolation_forest = IsolationForest(contamination=0.05, random_state=42)
  isolation_labels = isolation_forest.fit_predict(feature_matrix)

  dbscan = DBSCAN(eps=3.0, min_samples=5)
  dbscan_labels = dbscan.fit_predict(spatial_matrix)

  frame['if_anomaly'] = isolation_labels == -1
  frame['dbscan_anomaly'] = dbscan_labels == -1

  flagged_rows = frame[frame['if_anomaly'] | frame['dbscan_anomaly']]
  if flagged_rows.empty:
    return []

  detected_at = datetime.now(timezone.utc)
  anomalies = []

  for row in flagged_rows.itertuples(index=False):
    if row.if_anomaly and row.dbscan_anomaly:
      reason = 'both'
    elif row.if_anomaly:
      reason = 'isolation_forest'
    else:
      reason = 'dbscan'

    anomalies.append(
      {
        'type': asset_type,
        'id': getattr(row, id_field),
        'lat': float(getattr(row, 'lat')),
        'lon': float(getattr(row, 'lon')),
        'reason': reason,
        'timestamp': getattr(row, 'timestamp'),
        'detected_at': detected_at,
      }
    )

  return anomalies


def main():
  mongo_uri = load_settings()
  client = MongoClient(mongo_uri)

  try:
    database = client[DATABASE_NAME]
    aircraft_collection = database[AIRCRAFT_COLLECTION]
    vessel_collection = database[VESSEL_COLLECTION]
    anomaly_collection = database[ANOMALY_COLLECTION]

    start_time = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)

    aircraft_records = load_records(
      aircraft_collection,
      start_time,
      {
        '_id': 0,
        'icao24': 1,
        'lat': 1,
        'lon': 1,
        'alt': 1,
        'velocity': 1,
        'track': 1,
        'timestamp': 1,
      },
    )
    vessel_records = load_records(
      vessel_collection,
      start_time,
      {
        '_id': 0,
        'mmsi': 1,
        'lat': 1,
        'lon': 1,
        'speed': 1,
        'course': 1,
        'timestamp': 1,
      },
    )

    aircraft_anomalies = detect_anomalies(aircraft_records, 'aircraft', 'icao24', 'velocity')
    vessel_anomalies = detect_anomalies(vessel_records, 'vessel', 'mmsi', 'speed')

    anomaly_collection.delete_many({})
    all_anomalies = aircraft_anomalies + vessel_anomalies
    if all_anomalies:
      anomaly_collection.insert_many(all_anomalies)

    print(
      f'Detected {len(aircraft_anomalies)} aircraft anomalies, '
      f'{len(vessel_anomalies)} vessel anomalies'
    )
  finally:
    client.close()


if __name__ == '__main__':
  main()
