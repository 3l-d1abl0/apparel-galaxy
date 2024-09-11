from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pymongo.collection import Collection
from .database import db
from .models import UserInDB
from .utils import verify_password #, decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_user(email: str):
    users_collection: Collection = db.users
    user = users_collection.find_one({"email": email})
    
    if user:
        return UserInDB(**user)
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    print("User:: ",user)
    if not user:
        return False
    #if not decode_access_token(password, user['hashed_password']):
    if not verify_password(password, user.hashed_password):
        return False
    return user

'''
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        email = decode_access_token(token)
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(email)
    if user is None:
        raise credentials_exception
    return user
'''