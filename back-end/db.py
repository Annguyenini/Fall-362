import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
#read env and load into connection,dictcursor for formatting
load_dotenv()

def get_connection():
    return psycopg2.connect(
<<<<<<< HEAD
        host="127.0.0.1",
        port=5435,
=======
        host=os.getenv("DATABASE_HOST"),
        port=os.getenv("DATABASE_PORT"),
>>>>>>> origin/back-end
        dbname=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USER"),
        password=os.getenv("DATABASE_PASS"),
        cursor_factory=RealDictCursor,
    )