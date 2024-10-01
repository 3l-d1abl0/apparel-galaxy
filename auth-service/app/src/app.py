from fastapi import FastAPI, Depends, HTTPException, status
from .schemas import UserCreate, Token, Success, LoginForm
from .database import db
from .utils import get_password_hash, validate_password, create_access_token
from .auth import authenticate_user
from .logger import logger
from datetime import datetime
from .config import get_settings,Settings
from contextlib import asynccontextmanager
from .middleware import log_middleware
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
Auth service for Apparel Galaxy . 🚀

## Endpoints
* **register** (_register a user_).
* **onboard** (_registers a user as admin_).
* **login** (_login user and issue jwt_).
"""

app = FastAPI(lifespan=lifespan,
              title="   Auth Service - ApparelGalaxy",
            description=description,
            summary="A microservice for handling auth functionality",
            version="0.0.1",
            terms_of_service="http://example.com/terms/",
            contact={
                "name": "Sameer",
                "url": "http://github.com/3l-d1abl0",
                "email": "sameer.barha12@gmail.com",
            },)

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
    except DuplicateKeyError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Failed to insert user")    

    return {"status": "Success"}


'''
Register end point for admin user access
'''
@app.post("/onboard", response_model=Success)
async def register_admin(user: UserCreate, settings: Settings = Depends(get_settings)):

    try:
        user_dict = user.model_dump()
    except ValidationError as e:
        raise HTTPException(status_code=400, detail="Invalid user data")

    #check for password validity
    if validate_password(user.password) == False:
        raise HTTPException(status_code=400, detail="Password must be 9-30 in length and have alphanumeric character")
    
    _,domain = user.email.split("@")
    #Check if email if from apparelgalaxy.com
    if domain != "apparelgalaxy.com":
        raise HTTPException( status_code=status.HTTP_401_UNAUTHORIZED, detail="user not authorized")


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
    user_dict.update({ "user_type": 0, "created_at": datetime.now()})

    #Insert user to DB
    try:
        
        op = users_collection.insert_one(user_dict)
        
    except DuplicateKeyError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Failed to insert user")    

    return {"status": "Success"}


#Login Users
@app.post("/login", response_model=Token)
async def login_user(user: UserCreate):
#async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):

    try:
        user.model_dump()

        if not validate_password(user.password):
            return False

        user = authenticate_user(user.email, user.password)
        if user == False:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"user": user.email, "role": user.user_type, "id": str(user.id)})

        return {"access_token": access_token, "token_type": "bearer"}

    except ValidationError as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail="Invalid user data")
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Failed to login user")