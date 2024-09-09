from fastapi import FastAPI, Depends, HTTPException, status
import logging


from src.config import get_settings,Settings
log = logging.getLogger("uvicorn")
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting up...")
    yield
    log.info("Shutting down...")

app = FastAPI(lifespan=lifespan)


@app.get("/ping")
async def pong(settings: Settings = Depends(get_settings)):
    #return { "ping": settings }
    return "pong"

@app.get("/")
async def welcome():
    return { "service": "auth" }