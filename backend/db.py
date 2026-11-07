import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')
_mongo_url = os.environ['MONGO_URL']
if _mongo_url.startswith('mongomock'):
    from mongomock_motor import AsyncMongoMockClient

    client = AsyncMongoMockClient()
else:
    client = AsyncIOMotorClient(_mongo_url)
db = client[os.environ['DB_NAME']]
