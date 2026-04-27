from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in environment")

_client = None
_db = None

def get_db():
    global _client, _db

    if _db is None:
        _client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000
        )
        _db = _client.get_default_database()

        # Force connection test
        _db.command("ping")

    return _db
