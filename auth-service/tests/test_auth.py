from app.src.auth import get_user, authenticate_user
from app.src.models import UserInDB
import time


def test_get_user(test_client_with_user_data):

    test_client_instance, user_payload = test_client_with_user_data
    response = test_client_instance.post("/register", json=user_payload)
    response_json = response.json()
    
    #Check1
    assert response.status_code == 200
    
    #Email exists in the DB
    user = get_user(user_payload["email"])
    #Check2
    assert type(user) is UserInDB

    non_existent_email = "test_user7171@example.com"
    user = get_user(non_existent_email)

    #Check3
    assert user is None


def test_authenticate_user(test_client_with_user_data):

    test_client_instance, user_payload = test_client_with_user_data
    response = test_client_instance.post("/register", json=user_payload)
    response_json = response.json()
    
    #Check1
    assert response.status_code == 200

    user = authenticate_user(user_payload["email"], user_payload["password"])

    #Check2 - valid password
    assert type(user) is UserInDB

    user = authenticate_user(user_payload["email"], "@@random#$#$#password12;")
    #Check3 - Invalid password
    assert user is False