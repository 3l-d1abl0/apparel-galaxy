import uvicorn
from src.config import get_settings, Settings

settings: Settings = get_settings()

if __name__ == "__main__":
    uvicorn.run("src.app:app", host="0.0.0.0", port=settings.PORT, log_level="info")