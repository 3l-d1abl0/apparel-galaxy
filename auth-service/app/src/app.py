from fastapi import FastAPI
import logging


log = logging.getLogger("uvicorn")
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting up...")
    yield
    log.info("Shutting down...")

app = FastAPI(lifespan=lifespan)