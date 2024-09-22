from fastapi import FastAPI, Depends,Request
from .logger import logger
from datetime import datetime
from .config import get_settings,Settings
from contextlib import asynccontextmanager
from src.middleware import JWTMiddleware, LOGMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError
from pymongo.collection import Collection
#from bson import errors
from pymongo.errors import DuplicateKeyError


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")


description = """
Order service for Apparel Galaxy . 🚀

## Endpoints

"""

app = FastAPI(lifespan=lifespan,
              title="   Order Service - ApparelGalaxy",
            description=description,
            summary="A microservice for handling user Orders",
            version="0.0.1",
            terms_of_service="http://example.com/terms/",
            contact={
                "name": "Sameer",
                "url": "http://github.com/3l-d1abl0",
                "email": "sameer.barha12@gmail.com",
            },)

# Add middlewares
#app.add_middleware(BaseHTTPMiddleware, dispatch=ORDERSERVICEMiddleware.log_middleware)
# app.add_middleware(BaseHTTPMiddleware, dispatch=log_middleware)
# app.add_middleware(BaseHTTPMiddleware, dispatch=jwt_extract)

# Add middlewares
app.add_middleware(LOGMiddleware.LoggingMiddleware)
app.add_middleware(JWTMiddleware.JWTMiddleware)

#Ping Route
@app.get("/ping")
async def pong(settings: Settings = Depends(get_settings)):
    #return { "ping": settings }
    return "pong"

@app.get("/")
async def welcome():
    return { "service": "order" }

@app.post("/order")
async def create_order(request: Request):

    print(request.state.user)
    '''
        1. Add middleware to check for JWT token
        2. check if the user sending checkout request is the same user
        the cart belongs to (call User Service)

        3. reserve the cart Products (keep concurrency in mind)
        and create a an Order

    '''

    return {"ok": "okok"}