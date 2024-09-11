#Test utillity functions
from app.src.utils import get_password_hash, create_access_token, validate_password
import random
from jose import jwt

def test_get_password_hash():

    password_text = "123sadasdasda1234"
    assert bool(get_password_hash(password_text))

def test_create_access_token(app_settings):

    user_data={
        "user": "test_user"+str(random.randint(0,99))+"@gadgetgalaxy.com",
        "user_type": 1,
    }

    jwt_token = create_access_token(user_data)
    assert bool(jwt_token)

    #jwt_token = "bnmbhjghjjg"
    try:
        decoded_token = jwt.decode(jwt_token, app_settings.JWT_SECRET, algorithms=[app_settings.JWT_ALGORITHM])
        assert True
    except Exception as e:
        #log
        assert False


def test_validate_password():

    #No special Character
    password_text = "123sadasdasda1234"
    assert validate_password(password_text)==False

    #No number
    password_text = "sadasdasda###"
    assert validate_password(password_text)==False

    #No alphabet
    password_text = "###123123&*$@@1"
    assert validate_password(password_text)==False

    #must be 9 - 20 in length
    password_text = "#wew12;"
    assert validate_password(password_text)==False

    #Valid password
    password_text = "#@@wew12RandomPasss;"
    assert validate_password(password_text)==True