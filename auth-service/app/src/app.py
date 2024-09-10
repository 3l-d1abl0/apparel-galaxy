from fastapi import FastAPI, Depends, HTTPException, status
from .logger import logger

from src.config import get_settings,Settings
from contextlib import asynccontextmanager
from .middleware import log_middleware
from starlette.middleware.base import BaseHTTPMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)
app.add_middleware(BaseHTTPMiddleware, dispatch=log_middleware)


@app.get("/ping")
async def pong(settings: Settings = Depends(get_settings)):
    #return { "ping": settings }
    return "pong"

@app.get("/")
async def welcome():
    return { "service": "auth" }