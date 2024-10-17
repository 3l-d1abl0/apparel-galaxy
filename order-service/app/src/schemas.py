from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import List, Any, Annotated
from bson import ObjectId
from datetime import datetime
import time
from pydantic_core import core_schema

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
            cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, value) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")

        return ObjectId(value)

class ProductSchema(BaseModel):
    productId: PyObjectId
    vSku: str
    vQuantity: int
    vPrice: float


class OrderCreateSchema(BaseModel):
    items: List[ProductSchema]
    totalAmount: int

    @field_validator("totalAmount")
    def check_total_amount(cls, amount: int, info: ValidationInfo) -> int:
        #print("DATA: ",info.data)
        if amount < 0:
            raise ValueError("Total cart amount can't be or Negative")
        return amount
    
    @field_validator("items")
    def check_cart_items(cls, items: List[ProductSchema], info: ValidationInfo) -> List[ProductSchema]:

        if len(items) ==0:
            raise ValueError("Cart items can't be empty !")
        
        for product in items:
            print(product.vSku)
            if len(product.vSku) ==0:
                raise ValueError("vSku can't be empty !")
            if product.vQuantity <=0:
                raise ValueError("Quantity can't be Zero or negative !")
            if product.vPrice <0:
                raise ValueError("Price can't be negative !")
        return items


class OrderResponseSchema(BaseModel):
    id: PyObjectId = Field(alias="_id")
    userId: PyObjectId
    items: List[ProductSchema]
    totalAmount: int
    status: str
    created_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AllOrders(BaseModel):
    orders: List[OrderResponseSchema]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True