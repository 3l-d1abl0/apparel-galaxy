import json
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi




if __name__ == "__main__":


    client = MongoClient("mongodb+srv://mongoAtlas:your_lik_to_mongo_db_cluster", server_api=ServerApi('1'))

    #choose the db
    db = client["apparel-galaxy"]

    inventory_collection = db.inventory

    with open("galaxy.json", "rt") as f:
        products = json.load(f)

        for idx, data in enumerate(products['feed']['catalog']['add']['items']):

            print(idx)

            inventory_collection.insert_one(data)


