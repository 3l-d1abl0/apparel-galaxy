from fastapi import FastAPI, Depends, Request, HTTPException
from .logger import logger
from .config import get_settings,Settings
from contextlib import asynccontextmanager
from src.middleware import JWTMiddleware, LOGMiddleware
from src.middleware.SignatureCheck import signature_check
from .schemas import OrderCreateSchema, OrderResponseSchema, AllOrders
from pymongo.collection import Collection
from bson import ObjectId
from typing import List
from pydantic import ValidationError
from datetime import datetime
from pydantic import create_model
from .models import get_all_orders, get_order_data, confirm_order, add_failure_data
from .database import db

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

# Subapp for private routes
private_app = FastAPI()

# Add middlewares
#app.add_middleware(BaseHTTPMiddleware, dispatch=ORDERSERVICEMiddleware.log_middleware)
# app.add_middleware(BaseHTTPMiddleware, dispatch=log_middleware)
# app.add_middleware(BaseHTTPMiddleware, dispatch=jwt_extract)

#Ping Route
@app.get("/ping")
async def pong(settings: Settings = Depends(get_settings)):
    return "pong from "+settings.SERVICE_NAME


# Add middlewares
private_app.add_middleware(LOGMiddleware.LoggingMiddleware)
private_app.add_middleware(JWTMiddleware.JWTMiddleware)


@private_app.get("/order", response_model=AllOrders)
async def fetch_order(request: Request, settings: Settings = Depends(get_settings)):
    user_id = request.state.user['id']
    print("USERID: ", user_id)
    user_order_data = get_all_orders(user_id)

    if user_order_data == False:
        raise HTTPException(status_code=500, detail="Failed to fetch Orders")    
    
    user_orders = []
    for order in user_order_data:
        order_schema = OrderResponseSchema(**order)
        user_orders.append(order_schema)

    return AllOrders(orders=user_orders)


#@private_app.post("/order", dependencies=[Depends(signature_check)])
@private_app.post("/order", response_model=OrderResponseSchema, dependencies=[Depends(signature_check)])
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
        pass
    except Exception as e:
        logger.error("/order",e)
        raise HTTPException(status_code=500, detail="Failed to create Order")    

    return order_dict


query_params_order_success = {"session_id": (str, "")}
query_model = create_model("Query", **query_params_order_success)

@private_app.get("/orderSuccess" , response_model=OrderResponseSchema)
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




@private_app.get("/orderFailure" , response_model=OrderResponseSchema)
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

app.mount("", private_app)