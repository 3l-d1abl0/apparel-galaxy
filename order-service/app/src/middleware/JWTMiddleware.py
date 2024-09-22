from fastapi import Request, HTTPException
from src import logger
from src.config import get_settings, Settings
from jose import JWTError, jwt
import json
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from fastapi.responses import JSONResponse


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):

        print("\n------------------------")
        print("Request Information:")
        print(f"Method: {request.method}")
        print(f"URL: {request.url}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Query Params: {dict(request.query_params)}")
        
        # Print body for POST, PUT, PATCH requests
        if request.method in ["GET", "POST", "PUT", "PATCH"]:
            body = await request.body()
            try:
                body_json = json.loads(body)
                print(f"Body: {json.dumps(body_json, indent=2)}")
            except json.JSONDecodeError:
                print(f"Body: {body.decode()}")
        
        #Extract Auth header
        try:
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Auth token missing"}
                )
        except Exception as e:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )
        

        token = auth_header.split(" ")[1]  # Extract token after 'Bearer'
        settings: Settings = get_settings()

        try:
            # Decode and validate JWT
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

            email: str = payload.get("user")
            role: int = payload.get("role")

            print(payload)
            print("$$$$$$$$$$$$$")

            if email is None or role is None:
                raise HTTPException(status_code=401, detail="Invalid token")
        
            print(payload)
            request.state.user = payload
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )

        # Continue processing request if the token is valid
        response = await call_next(request)
        return response
