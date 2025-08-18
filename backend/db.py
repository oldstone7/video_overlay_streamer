import os
from pymongo import MongoClient
from dotenv import load_dotenv


load_dotenv()

_client = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        _client = MongoClient(mongo_uri)
    return _client


def get_db():
    db_name = os.getenv("DB_NAME", "stream_overlay")
    return _get_client()[db_name]


