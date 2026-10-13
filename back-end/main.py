import uuid
from typing import Annotated

import psycopg2
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from psycopg2.extensions import connection as Connection
from pydantic import BaseModel, PositiveInt

from db import get_db

app = FastAPI()

#reusable dependency (have to use Annotated to make it compliant with ruff)
DbConn = Annotated[Connection, Depends(get_db)]

#translate any psycopg2 error into a 500 so no need to repeat in every endpoint
@app.exception_handler(psycopg2.Error)
def db_error_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Could not complete request: {exc!s}"},
    )

# using pydantic model for req body shape(make sure location get sent)
class InventoryCreate(BaseModel):
    location: str

#Model for item
class ItemCreate(BaseModel):
    sku: int
    title: str
    price: float

#model for stock
class StockCreate(BaseModel):
    inventory_id: str
    sku: int 
    batch_id: int
    quantity: PositiveInt
    shelf: str

@app.get("/")
async def root():
    return {"message": "Hello World"}

#open database connection,pull every row from items table,return as JSON
#try block to guarentee connection close
@app.get("/items")
def get_items(conn: DbConn):
    with conn.cursor() as cur:
        cur.execute("SELECT sku, title, price FROM items ORDER BY sku;")
        return cur.fetchall()

#Get Specific Item by sku
@app.get("/item/{sku}")
def get_item(sku: int, conn: DbConn):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM items WHERE sku = %s", (sku,))
        item = cur.fetchone()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with sku: {sku} does not exist",
            )
        return item
    

#Add new item into items(let primary key enforce uniqueness,psycopg auto throw error if duplicate)
#Pass in sku,title,price
@app.post("/item",status_code=status.HTTP_201_CREATED)
def create_item(body: ItemCreate, conn:DbConn):
    with conn.cursor() as cur:
        try:
            cur.execute(
                "INSERT INTO items (sku, title, price) VALUES (%s, %s, %s) "
                "RETURNING sku, title, price;",
                (body.sku, body.title, body.price),
            )
            new_item = cur.fetchone()
        except psycopg2.errors.UniqueViolation:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Item with sku:{body.sku} already exists.",
            )
    return {"message": "Item created successfully", "item": new_item}

#remove item from items
@app.delete("/item/{sku}")
def delete_item(sku: int, conn:DbConn):
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM items WHERE sku = %s RETURNING sku, title, price",
            (sku, ),
        )
        deleted_item = cur.fetchone()
        if not deleted_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with sku: {sku} does not exist",
            )
    return {"message": "Item deleted successfully", "deleted_item": deleted_item}

#pass in location to generate new uuid and add a new inventory, returns new id and location
@app.post("/inventories",status_code=status.HTTP_201_CREATED)
def create_inventory(body: InventoryCreate, conn: DbConn):
    new_id = str(uuid.uuid4())
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO inventories (inventory_id, location) VALUES (%s, %s);",
            (new_id, body.location),
        )
    return {"inventory_id": new_id, "location": body.location}


#return all inventories for front end buttons
@app.get("/inventories")
def get_inventories(conn: DbConn):
    with conn.cursor() as cur:
        cur.execute("SELECT inventory_id, location FROM inventories ORDER BY location;")
        return cur.fetchall()


#Remove an inventory from inventories
@app.delete("/inventories/{inventory_id}")
def delete_inventory(inventory_id: str, conn: DbConn):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM inventories WHERE inventory_id = %s "
            "RETURNING inventory_id, location",
            (inventory_id,),
        )
        deleted_inventory = cur.fetchone()
        if not deleted_inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory {inventory_id} does not exist.",
            )
    return {
        "message": "Inventory has been deleted successfully",
        "deleted_inventory": deleted_inventory,
    }
 

#Return all items and batch records from inventory
@app.get("/inventory")
def get_inventory_items(conn: DbConn):
    with conn.cursor() as cur:
        cur.execute(
            '''SELECT inventory_id, sku, batch_id, quantity, shelf, time_added, time_alert 
            FROM inventory 
            ORDER BY inventory_id, sku, batch_id''')
        return cur.fetchall()

#Return items and batch record for one inventory from inventory_id 
@app.get("/inventory/{inventory_id}/items")
def get_items_in_inventory(inventory_id: str, conn: DbConn):
    with conn.cursor() as cur:
    #Verify location exits
        cur.execute("SELECT inventory_id FROM inventories WHERE inventory_id = %s",(inventory_id,))
        inventory_location = cur.fetchone()
        if not inventory_location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail = f"Inventory with id: {inventory_id} does not exits")
        #Get items for inventory with matching inventory_id
        cur.execute(
            '''SELECT inventory_id, sku, batch_id, quantity, shelf, time_added, time_alert
            FROM inventory
            WHERE inventory_id = %s
            ORDER BY sku, batch_id''', (inventory_id,))
        return cur.fetchall()

#add stock to inventory
@app.post("/inventory", status_code=status.HTTP_201_CREATED)
def add_stock(body: StockCreate, conn:DbConn):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO inventory (inventory_id, sku, batch_id, quantity, shelf, time_added, time_alert)"
            "VALUES (%s, %s, %s, %s, %s , now(), now())"
            "RETURNING inventory_id, sku, batch_id, quantity, shelf, time_added, time_alert;",
            (body.inventory_id, body.sku, body.batch_id, body.quantity, body.shelf),
        )
        new_stock = cur.fetchone()
    return {"message": "Stock added successfully", "stock": new_stock}
