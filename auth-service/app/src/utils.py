from fastapi import Depends, HTTPException
from passlib.context import CryptContext
from jose import JWTError, jwt
from .config import get_settings, Settings
from .models import UserInDB
from typing import Optional
import re

import time



def validate_password(password):
    
    #passwd must be 9 to 30 len word
    if not 9 <= len(password) <= 30:
        return False
    
    #Must have a nuuber
    if not re.search(r'\d', password):
        return False
    
    #Must have an alphabet
    if not re.search(r'[A-Za-z]', password):
        return False
    
    #Must have a special character
    if not re.search(r'[\W_]', password):
        return False
    
    return True


def get_password_hash(password: str):
    try:
        configs = get_settings()
        print(configs)
        pwd_context = CryptContext(schemes=["bcrypt"],bcrypt__rounds=configs.HASH_ROUNDS, deprecated="auto")
        return pwd_context.hash(configs.SECRET_SALT1+password+configs.SECRET_SALT2)
    except Exception as e:
        #Log error
        print(e)
        return False
        #raise HTTPException(status_code=500, detail="Failed to hash password")

def create_access_token(data: dict):

    #if not isinstance(data, dict):
    #    return False
    
    settings : Settings = get_settings()
    try:
        payload = data.copy()
        
        
        issued_at = int(time.time())
        expiration_time = int(time.time()) + (60*int(settings.JWT_EXPIRATION_TIME_MINUTES))
        
        payload.update({"iat": issued_at, "exp": expiration_time})
        encoded_jwt = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

        return encoded_jwt
    
    except JWTError as e:
        #Log Error
        return False
        #raise HTTPException(status_code=401, detail="Could not create access token")



def verify_password(plain_password, hashed_password):
    configs = get_settings()
    pwd_context = CryptContext(schemes=["bcrypt"],bcrypt__rounds=configs.HASH_ROUNDS, deprecated="auto")
    return pwd_context.verify(configs.SECRET_SALT1+plain_password+configs.SECRET_SALT2, hashed_password)

'''
def decode_access_token(token: str, settings: Settings = Depends(get_settings)):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception
'''