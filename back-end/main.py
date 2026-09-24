from fastapi import FastAPI
from db import get_connection

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

#open database connection,pull every row from items table,return as JSON
#try block to guarentee connection close
@app.get("/items")
def get_items():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT sku,title,price FROM items ORDER BY sku;")
            return cur.fetchall()
    finally:
        conn.close()