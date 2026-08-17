import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / '.env'
DATABASE_NAME = 'osint_db'
AIRCRAFT_COLLECTION = 'aircraft_states'
VESSEL_COLLECTION = 'vessel_states'
ANOMALY_COLLECTION = 'anomalies'
TIME_WINDOW = timedelta(minutes=5)

load_dotenv(ENV_PATH)
MONGO_URI = os.getenv('MONGO_URI')

if not MONGO_URI:
    raise RuntimeError('MONGO_URI is not set in the project root .env file.')


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = AsyncIOMotorClient(MONGO_URI)
    app.state.sync_client = MongoClient(MONGO_URI)
    db = app.state.client[DATABASE_NAME]
    sync_db = app.state.sync_client[DATABASE_NAME]
    app.state.aircraft_collection = db[AIRCRAFT_COLLECTION]
    app.state.vessel_collection = db[VESSEL_COLLECTION]
    app.state.anomaly_collection = sync_db[ANOMALY_COLLECTION]
    yield
    app.state.client.close()
    app.state.sync_client.close()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def parse_iso_timestamp(ts: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid ISO8601 timestamp.') from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


async def fetch_history(collection, ts: str, limit: int, fields: dict):
    center = parse_iso_timestamp(ts)
    start = center - TIME_WINDOW
    end = center + TIME_WINDOW
    cursor = collection.find(
        {'timestamp': {'$gte': start, '$lte': end}},
        fields,
    ).sort('timestamp', 1).limit(limit)
    documents = await cursor.to_list(length=limit)
    for doc in documents:
        doc.pop('_id', None)
        doc['timestamp'] = to_iso(doc.get('timestamp'))
    return documents


async def get_collection_bounds(collection):
    earliest_doc = await collection.find_one({}, sort=[('timestamp', 1)], projection={'_id': 0, 'timestamp': 1})
    latest_doc = await collection.find_one({}, sort=[('timestamp', -1)], projection={'_id': 0, 'timestamp': 1})
    return (
        earliest_doc.get('timestamp') if earliest_doc else None,
        latest_doc.get('timestamp') if latest_doc else None,
    )


@app.get('/history/aircraft')
async def get_aircraft_history(ts: str = Query(...)):
    return await fetch_history(
        app.state.aircraft_collection, ts, 2000,
        {'_id': 0, 'icao24': 1, 'lat': 1, 'lon': 1, 'alt': 1, 'velocity': 1, 'track': 1, 'timestamp': 1},
    )


@app.get('/history/vessels')
async def get_vessel_history(ts: str = Query(...)):
    return await fetch_history(
        app.state.vessel_collection, ts, 1000,
        {'_id': 0, 'mmsi': 1, 'lat': 1, 'lon': 1, 'speed': 1, 'course': 1, 'timestamp': 1},
    )


@app.get('/history/range')
async def get_history_range():
    aircraft_earliest, aircraft_latest = await get_collection_bounds(app.state.aircraft_collection)
    vessel_earliest, vessel_latest = await get_collection_bounds(app.state.vessel_collection)
    candidates_earliest = [v for v in [aircraft_earliest, vessel_earliest] if v is not None]
    candidates_latest = [v for v in [aircraft_latest, vessel_latest] if v is not None]
    earliest = min(candidates_earliest) if candidates_earliest else None
    latest = max(candidates_latest) if candidates_latest else None
    return {'earliest': to_iso(earliest), 'latest': to_iso(latest)}


@app.get('/anomalies')
async def get_anomalies():
    documents = list(
        app.state.anomaly_collection
        .find({})
        .sort('timestamp', -1)
        .limit(50)
    )

    for doc in documents:
        doc['_id'] = str(doc['_id'])

    return documents


@app.get('/api/opensky/states/all')
async def proxy_opensky(lamin: float, lomin: float, lamax: float, lomax: float):
    import httpx
    url = 'https://opensky-network.org/api/states/all'
    params = {'lamin': lamin, 'lomin': lomin, 'lamax': lamax, 'lomax': lomax}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        return JSONResponse(content=r.json(), status_code=r.status_code)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('api:app', host='0.0.0.0', port=8000)
