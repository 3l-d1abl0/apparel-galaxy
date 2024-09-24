import logging
import os
from functools import lru_cache
from pydantic_settings import BaseSettings

from .logger import logger

class Settings(BaseSettings):

    environment: str = os.getenv("environment", "dev")
    testing: bool = os.getenv("testing", False)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGO_DB: str = os.getenv("MONGO_DB", "apparel-galaxy")
    MONGO_INVENTORY_COLLECTION:str = os.getenv("MONGO_INVENTORY_COLLECTION", "inventory")
    MONGO_USER_COLLECTION: str = os.getenv("MONGO_USER_COLLECTION", "users")
    MONGO_ORDERS_COLLECTION: str = os.getenv("MONGO_USER_COLLECTION", "orders")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_secret_key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_TIME_MINUTES: int = int(os.getenv("JWT_EXPIRATION_TIME_MINUTES", 5))
    SECRET_SALT1: str = os.getenv("SECRET_SALT1", "your_secret_salt1")
    SECRET_SALT2: str = os.getenv("SECRET_SALT2", "your_secret_salt2")
    HASH_ROUNDS: int = os.getenv("HASH_ROUNDS", 2)
    PORT: int = os.getenv("PORT", 8000)


@lru_cache()
def get_settings() -> BaseSettings:
    logger.info("Loading config settings from the environment...")
    return Settings()
