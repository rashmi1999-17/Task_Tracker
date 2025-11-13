from pymongo import MongoClient

# Connect to local MongoDB Compass
client = MongoClient("mongodb://localhost:27017/")

# Create or connect to a database
db = client["login_system"]

# Create or connect to a collection
users_collection = db["users"]
