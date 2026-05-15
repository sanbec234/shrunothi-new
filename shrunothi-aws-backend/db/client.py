from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

_client = None
_db = None

def get_db():
    global _client, _db

    if _db is None:
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise RuntimeError("MONGO_URI not set in environment")

        _client = MongoClient(
            mongo_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5,
            waitQueueTimeoutMS=3000,
        )
        _db = _client.get_default_database()
        _db.command("ping")

    return _db
