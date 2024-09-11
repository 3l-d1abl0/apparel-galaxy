import uvicorn
from src.config import get_settings, Settings
from src.logger import logger
settings: Settings = get_settings()

if __name__ == "__main__":
    logger.info('Starting uvicorn ... ')
    uvicorn.run("src.app:app", host="0.0.0.0", port=settings.PORT, reload="true")