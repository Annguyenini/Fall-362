from fastapi import FastAPI, HTTPException, status
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

#Get Specific Item by sku
@app.get("/items/{sku}")
def get_items(sku):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM items WHERE sku = %s", (sku,))
            item = cur.fetchone()
            if not item:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                    detail = f"Item with sku: {sku} does not exist")
            return item
    finally:
        conn.close()