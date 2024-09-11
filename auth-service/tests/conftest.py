
import os
from typing import Any
from typing import Generator, Tuple
import random

import pytest
from fastapi.testclient import TestClient

from app.src.app import app
from app.src.config import get_settings, Settings

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

def get_settings_override():
    #return Settings(testing=1, database_url=os.environ.get("GOPATH"))
    return Settings()

@pytest.fixture(scope="function")
def app_settings()-> Generator[Settings, Any, None]:

    yield get_settings_override()


@pytest.fixture(scope="function")
def normal_user_data()-> Generator[dict, Any, None]:
    #Prepare email +password combo
    user = {
        "email": "test_user"+str(random.randint(0,99))+"@example.com",
        "password": "@/somerando111mpassword;",
    }
    
    yield user

    # tear down - remove the test user
    client = MongoClient(os.getenv("MONGO_URI"), server_api=ServerApi('1'))
    db = client[os.getenv("MONGO_DB")]
    db[os.getenv("MONGO_USER_COLLECTION")].delete_many({"email": user["email"]})


@pytest.fixture(scope="function")
def admin_user_data()-> Generator[dict, Any, None]:

    #Prepare email +password combo
    user = {
        "email": "test_user"+str(random.randint(0,99))+"@apparelgalaxy.com",
        "password": "6hrVDXv.Fp7z./J?Cf%EF3%",
    }
    
    yield user

    # tear down - remove the test user
    client = MongoClient(os.getenv("MONGO_URI"), server_api=ServerApi('1'))
    db = client[os.getenv("MONGO_DB")]
    db[os.getenv("MONGO_USER_COLLECTION")].delete_many({"email": user["email"]})


@pytest.fixture(scope="function")
def test_client()-> Generator[TestClient, Any, None]:
    
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="function")
def test_client_with_user_data(normal_user_data: dict)-> Generator[Tuple[TestClient, Any], None, None]:
    
    
    app.dependency_overrides[get_settings] = get_settings_override
    with TestClient(app) as test_client:

        # testing
        yield test_client, normal_user_data
        

@pytest.fixture(scope="function")
def test_client_with_admin_data(admin_user_data: dict)-> Generator[Tuple[TestClient, Any], None, None]:
    
    app.dependency_overrides[get_settings] = get_settings_override
    with TestClient(app) as test_client:

        # testing
        yield test_client, admin_user_data



'''
@pytest.fixture()
def user_payload():
    
    user_email = "test_user"+str(random.randint(0,99))+"@gadgetgalaxy.com"
    print("Email: ",user_email)
    return {
        "email": user_email,
        "password": "somerandompassword",
        
    }

'''