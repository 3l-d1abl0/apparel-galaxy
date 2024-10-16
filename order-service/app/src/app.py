from fastapi import FastAPI, Depends, Request, HTTPException
from .logger import logger
from .config import get_settings,Settings
from contextlib import asynccontextmanager
from src.middleware import JWTMiddleware, LOGMiddleware
from .schemas import OrderCreateSchema, PyObjectId, OrderResponseSchema
from pymongo.collection import Collection
from bson import ObjectId
from typing import List
from pydantic import ValidationError
from datetime import datetime
from pydantic import create_model
from .models import *

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


query_params_order_success = {"session_id": (str, "")}
query_model = create_model("Query", **query_params_order_success)

@app.get("/orderSuccess" , response_model=OrderResponseSchema)
async def order_success(request: Request, params: query_model = Depends(), settings: Settings = Depends(get_settings)):

    '''
    Supposed to handle the redict from the Payment Gateway.
    Usually there is a session_id from the payment gaateway.
    The server needs to confirm the session id from the Gateway
    following which the order status needs to be confirmed.
    '''

    if int(request.state.user['role']) != 0:
        raise HTTPException(status_code=401, detail="Unauthorized")

    query_params = params.dict()
    print("query_params: ", query_params)
    if query_params['session_id'] == "":
        raise HTTPException(status_code=400, detail="Invalid session_id")

    if not ObjectId.is_valid(query_params['session_id']):
        raise HTTPException(status_code=400, detail="Invalid session_id")

    #Check the session id/order_id
    order_id = query_params['session_id']
    order_data = get_order_data(order_id)

    if order_data is False:
        raise HTTPException(status_code=500, detail="Unable to fetch Order !")

    if order_data is None:
        raise HTTPException(status_code=400, detail="Order not found !")

    if order_data["status"] == 'CONFIRMED':
        raise HTTPException(status_code=400, detail="No pending Order !")

    '''
        Check if order_data["userId"] matches request.state.user id

        add Payment Data to Order
    '''

    ##Order Confirmed - Payment Successful
    order_status = confirm_order(order_id)
    if order_status== False:
        raise HTTPException(status_code=500, detail="No able to register Successful Payment !")
    
    order_data["status"] = 'CONFIRMED'

    return order_data




@app.get("/orderFailure" , response_model=OrderResponseSchema)
async def order_failure(request: Request, params: query_model = Depends(), settings: Settings = Depends(get_settings)):

    '''
    Supposed to handle the redict from the Payment Gateway for a failed Payment.
    Usually there is a session_id from the payment gaateway.
    The server needs to confirm the session id from the Gateway
    following which the order status needs to be confirmed.
    '''

    if int(request.state.user['role']) != 0:
        raise HTTPException(status_code=401, detail="Unauthorized")

    query_params = params.dict()
    print("query_params: ", query_params)
    if query_params['session_id'] == "":
        raise HTTPException(status_code=400, detail="Invalid session_id")

    if not ObjectId.is_valid(query_params['session_id']):
        raise HTTPException(status_code=400, detail="Invalid session_id")

    #Check the session id/order_id
    order_id = query_params['session_id']
    order_data = get_order_data(order_id)

    if order_data is False:
        raise HTTPException(status_code=500, detail="Unable to fetch Order !")

    if order_data is None:
        raise HTTPException(status_code=400, detail="Order not found !")

    if order_data["status"] == 'CONFIRMED':
        raise HTTPException(status_code=400, detail="No pending Order !")

    '''
        Check if order_data["userId"] matches request.state.user id
    '''

    ##Order Confirmed - Payment Successful
    order_status = add_failure_data(order_id)
    if order_status== False:
        raise HTTPException(status_code=500, detail="No able to register payment Failure !")

    return order_data