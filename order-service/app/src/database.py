from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

from .config import get_settings, Settings
from fastapi import Depends

settings: Settings = get_settings()
client = MongoClient(settings.MONGODB_URI, server_api=ServerApi('1'))

#choose the db
db = client[settings.MONGO_DB]
