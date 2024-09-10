from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    email: EmailStr

class UserInDB(User):
    hashed_password: str
    user_type:int

    class Config:
        from_attributes = True
