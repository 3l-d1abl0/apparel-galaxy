from fastapi import Request, HTTPException
from typing import Callable
from src.logger import logger
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from src.config import get_settings, Settings
from jose import JWTError, jwt
import time

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):

        print("$$$$$$$$$$$")
        print(request)
        start = time.time()
        response = await call_next(request)
        process_time = time.time() - start
        
        log_dict ={
            'url': request.url.path,
            'method': request.method,
            'process_time': process_time,
            'status': response.status_code
        }
        logger.info(log_dict)
        return response