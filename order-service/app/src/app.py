from fastapi import FastAPI, Depends, Request, HTTPException
from .logger import logger
from .config import get_settings,Settings
from contextlib import asynccontextmanager
from src.middleware import JWTMiddleware, LOGMiddleware
from .schemas import OrderCreateSchema, PyObjectId, OrderResponseSchema
from pymongo.collection import Collection
from .database import db
from bson import ObjectId
from typing import List
from pydantic import ValidationError
from datetime import datetime

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
    return "pong"

@app.get("/")
async def welcome():
    return { "service": "order" }


@app.post("/order", response_model=OrderResponseSchema)
async def create_order(request: Request, order_data: OrderCreateSchema, settings: Settings = Depends(get_settings)):

    try:
        order_dict = order_data.model_dump()
    except ValidationError as e:
        raise HTTPException(status_code=400, detail="Invalid user data")
    
    #Create Order
    order_dict.update({ "userId": request.state.user["id"], "status": "CREATED", "created_at": datetime.now()})
    orders_collection: Collection = db[settings.MONGO_ORDERS_COLLECTION]
    
    try:   
        orders_collection.insert_one(order_dict)
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Failed to create Order")    


    return order_dict