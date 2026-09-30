import uuid

import psycopg2
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

from db import get_connection

app = FastAPI()

# using pydantic model for req body shape(make sure location get sent)
class InventoryCreate(BaseModel):
    location: str

#Model for item
class ItemCreate(BaseModel):
    sku: int
    title: str
    price: float

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
@app.get("/item/{sku}")
def get_item(sku):
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

#Add new item into items
#Pass in sku,title,price
@app.post("/item",status_code=status.HTTP_201_CREATED)
def create_item(body: ItemCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            #Check if item already exists
            cur.execute("SELECT sku FROM items WHERE sku = %s",(body.sku,))
            existing_item = cur.fetchone()
            if existing_item:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail=f"Item with sku:{body.sku} already exists.")
            #Add item if it does not already exist
            cur.execute("INSERT INTO items (sku,title,price) VALUES (%s, %s, %s) RETURNING sku,title,price;",
                        (body.sku, body.title, body.price))
            new_item = cur.fetchone()
            conn.commit()
            return {"message": "Item created successfully",
                    "item": new_item}        
    #Return error if unexpected database error occurs and roll back changes
    except HTTPException:
        conn.rollback()
        raise
    except psycopg2.Error as error:
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Could not create item: {error!s}")
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

#Remove an inventory from inventories
@app.delete("/inventories/{inventory_id}")
def delete_inventory(inventory_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM inventories WHERE inventory_id = %s RETURNING inventory_id, location",
                        (inventory_id,))
            deleted_inventory = cur.fetchone()
            #Check if inventory exist
            if not deleted_inventory:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                    detail=f"Inventory {inventory_id} does not exist.")
            conn.commit()
            return {"message": "Inventory has been deleted successfully",
                    "deleted_inventory": deleted_inventory}
    #Return error if unexpected database error occurs and roll back changes
    except HTTPException:
        conn.rollback()
        raise
    except psycopg2.Error as error:
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Could not delete inventory: {error!s}")
    finally:
        conn.close()
