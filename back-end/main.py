from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from db import get_connection
import uuid

app = FastAPI()

# using pydantic model for req body shape(make sure location get sent)
class InventoryCreate(BaseModel):
    location: str


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

#pass in location to generate new uuid and add a new inventory, returns new id and location
@app.post("/inventories",status_code=status.HTTP_201_CREATED)
def create_inventory(body: InventoryCreate):
    new_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO inventories (inventory_id, location) VALUES (%s, %s);", (new_id, body.location),
            )
        conn.commit()
        return {"inventory_id": new_id, "location": body.location}
    finally:
        conn.close()

#return all inventories for front end buttons
@app.get("/inventories")
def get_inventories():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT inventory_id, location FROM inventories ORDER BY location;")
            return cur.fetchall()
    finally:
        conn.close()