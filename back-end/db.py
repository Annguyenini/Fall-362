import os

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

#read env and load into connection,dictcursor for formatting
load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DATABASE_HOST"),
        port=os.getenv("DATABASE_PORT"),
        dbname=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USER"),
        password=os.getenv("DATABASE_PASS"),
        cursor_factory=RealDictCursor,
    )