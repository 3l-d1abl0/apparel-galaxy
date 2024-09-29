from fastapi import Request, HTTPException
from src import logger
from src.config import get_settings, Settings
from jose import JWTError, jwt
import json
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from fastapi.responses import JSONResponse


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        
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

            if email is None or role is None:
                return JSONResponse(
                   status_code=401,
                    content={"detail": "Invalid or expired token"}
                )
            
            request.state.user = payload
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )

        # Continue processing request if the token is valid
        response = await call_next(request)
        return response
