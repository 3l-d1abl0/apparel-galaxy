from fastapi import Request, HTTPException, Depends
from src import logger
from src.config import get_settings, Settings
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from fastapi.responses import JSONResponse
import time
import hmac
import hashlib
import base64
import json

async def signature_check(request: Request, settings: Settings = Depends(get_settings)):
    
    try:
        #Extract Timestamp header
        request_time = request.headers.get("service-timestamp")
        if not request_time:
            raise Exception("ERR:Request timestamp missing")
        #Check for expiry
        request_time = int(request_time)
        print("T1: ",time.time())
        print("T2: ",request_time)
        if abs(time.time() - request_time) > settings.IPC_TIMEOUT:
            raise Exception("ERR:Request expired")
        
        #Check signature in Headers
        request_signature = request.headers.get("service-identity")
        if not request_signature or not request_signature.startswith("HMAC "):
            raise Exception("ERR:Request signature missing")
            
        
    except Exception as e:
        exception_string = str(e)
        print("Exceptiopn : Processing Signature", exception_string)
        if exception_string.startswith("ERR:"):
            raise HTTPException(status_code=401, detail=exception_string.replace("ERR:", ""))
        else:
            raise HTTPException(status_code=401, detail="Invalid or expired signature token")
        
    
    # Extract the provided HMAC signature from the header
    provided_hmac = request_signature.split(" ")[1]  # Extract token after 'HMAC'
    try:

        # Recalculate the HMAC on the server side
        payload = { "message": settings.IPC_PASSPHRASE }
        print("PAYLOAD: ", json.dumps(payload, separators=(',', ':')).encode())
        
        recalculated_hmac = hmac.new(settings.JWT_SECRET.encode() , json.dumps(payload, separators=(',', ':')).encode(), hashlib.sha256).hexdigest()

        print("HMAC: ", recalculated_hmac)
        # Verify that the provided HMAC matches the recalculated HMAC
        if not hmac.compare_digest(provided_hmac, recalculated_hmac):
            raise HTTPException(status_code=403, detail="Invalid HMAC signature")
        
        #Valid Signature

    except Exception as e:
        print("Exception : while processing service-identity", e)
        raise HTTPException(status_code=401, detail=str(e))
