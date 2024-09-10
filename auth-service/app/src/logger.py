import logging
import sys
import os

#get logger
logger = logging.getLogger("auth-logger")


#create formatter
formatter = logging.Formatter(
    fmt="%(levelname)s: %(asctime)s - %(filename)s:%(funcName)s -  - %(message)s"
)

#Create Handler
stream_handler = logging.StreamHandler(sys.stdout)

current_file_directory = os.path.dirname(__file__)
log_file_path = os.path.join(current_file_directory, '../logs/app.log')
file_handler = logging.FileHandler(log_file_path) 


stream_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

#Add handler to the Logger
logger.handlers = [stream_handler, file_handler]


#Set log Level
logger.setLevel(logging.INFO)