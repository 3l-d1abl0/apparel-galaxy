from fastapi import FastAPI, Depends, HTTPException, status
from .schemas import UserCreate, Token, Success, LoginForm
from .database import db
from .utils import get_password_hash, validate_password, create_access_token

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

#Ping Route
@app.get("/ping")
async def pong(settings: Settings = Depends(get_settings)):
    #return { "ping": settings }
    return "pong"

@app.get("/")
async def welcome():
    return { "service": "auth" }




#Register end point for normal user access
@app.post("/register", response_model=Success)
async def register_user(user: UserCreate, settings: Settings = Depends(get_settings)):


    try:
        user_dict = user.model_dump()
        print(user_dict)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail="Invalid user data")
    
    #check for password validity
    if validate_password(user.password) == False:
        raise HTTPException(status_code=400, detail="Password must be 9-30 in length and have alphanumeric character and a Special Character")

    #Check if email Exists
    users_collection: Collection = db[settings.MONGO_USER_COLLECTION]
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")


    #Try to hash Password
    hashed_password = get_password_hash(user.password)
    if hashed_password == False:
        raise HTTPException(status_code=500, detail="Failed to hash password")
    

    user_dict.update({"hashed_password": hashed_password})
    del user_dict['password']
    user_dict.update({ "user_type": 1, "created_at": datetime.now()})

    #Insert user to DB
    try:
        users_collection.insert_one(user_dict)
    except errors.DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to insert user")    

    return {"status": "Success"}

