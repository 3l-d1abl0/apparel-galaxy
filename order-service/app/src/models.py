from .database import db
from pymongo.collection import Collection
from bson import ObjectId
from datetime import datetime
from .logger import logger

order_collection: Collection = db.orders

def get_order_data(order_id) :
    
    try:
        order_data = order_collection.find_one(ObjectId(order_id))
        return order_data
    except Exception as e:
        logger.error(e)
        logger.error("Error while fetching order ::get_order_data: ", order_id)
        return False


def confirm_order(order_id)-> bool:

    try:
        data_to_update ={
            '$set': {
                'status': 'CONFIRMED',
                'updated_at': datetime.now()
            }
        }
        
        order_data = order_collection.update_one( { '_id': ObjectId(order_id) }, data_to_update)

        # Check if the document was updated
        if order_data.modified_count > 0:
            return True
        else:
            return False
        
    except Exception as e:
        logger.error(e)
        logger.error("Error while confirming order::confirm_order: ", order_id)
        return False