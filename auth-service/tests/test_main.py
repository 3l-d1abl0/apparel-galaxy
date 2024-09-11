import json
import os
import pytest


def test_root(test_client):
    response = test_client.get("/ping")
    assert response.status_code == 200

#Test user Registration
#@pytest.mark.skip(reason="testing others")
def test_register(test_client_with_user_data):

    test_client_instance, user_payload = test_client_with_user_data
    response = test_client_instance.post("/register", json=user_payload)
    response_json = response.json()
    
    assert response.status_code == 200

    # Check for response structure
    response_keys = set(response_json.keys())
    expected_keys = {"status"}

    assert response_keys == expected_keys, f"Unexpected keys found: {response_keys - expected_keys}"
    assert isinstance(response_json["status"], str)


#Test reregistration with same email
#@pytest.mark.skip(reason="testing others")
def test_reregistration(test_client_with_user_data):

    test_client_instance, user_payload = test_client_with_user_data
    response = test_client_instance.post("/register", json=user_payload)
    response_json = response.json()
    
    assert response.status_code == 200

    # Check for response structure
    response_keys = set(response_json.keys())
    expected_keys = {"status"}
    assert response_keys == expected_keys, f"Unexpected keys found: {response_keys - expected_keys}"
    assert isinstance(response_json["status"], str)

    #Try to re-register
    response = test_client_instance.post("/register", json=user_payload)
    response_json = response.json()
    print(response_json)
    assert response.status_code == 400
    assert response_json == { 'detail':'Email already registered'}


def test_onboarding(test_client_with_admin_data):

    test_client_instance, user_payload = test_client_with_admin_data
    response = test_client_instance.post("/onboard", json=user_payload)
    response_json = response.json()
    
    assert response.status_code == 200
    
    # Check for response structure
    response_keys = set(response_json.keys())
    expected_keys = {"status"}

    assert response_keys == expected_keys, f"Unexpected keys found: {response_keys - expected_keys}"
    assert isinstance(response_json["status"], str)


def test_reonboarding(test_client_with_admin_data):

    test_client_instance, user_payload = test_client_with_admin_data
    response = test_client_instance.post("/onboard", json=user_payload)
    response_json = response.json()
    
    assert response.status_code == 200
    
    # Check for response structure
    response_keys = set(response_json.keys())
    expected_keys = {"status"}

    assert response_keys == expected_keys, f"Unexpected keys found: {response_keys - expected_keys}"
    assert isinstance(response_json["status"], str)

    #Try to re-register/onboard
    response = test_client_instance.post("/onboard", json=user_payload)
    response_json = response.json()
    print(response_json)
    assert response.status_code == 400
    assert response_json == { 'detail':'Email already registered'}