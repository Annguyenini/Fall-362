import json
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

import psycopg2
from fastapi import Depends, FastAPI, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg2.extensions import connection as Connection
from pydantic import BaseModel, Field, PositiveInt, ValidationError

from db import get_db

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
    quantity: PositiveInt
    shelf: str
    time_alert: datetime | None = None

#model for modifying a stock row
class StockUpdate(BaseModel):
    quantity: PositiveInt | None = None
    time_alert: datetime | None = None

#model for item import
class ImportItem(BaseModel):
    sku: int
    title: str
    price: float

#model for stock import
class ImportStock(BaseModel):
    sku: int
    quantity: PositiveInt
    shelf: str

#model to import the whole inventory
class InventoryImport(BaseModel):
    location: str
    items: list[ImportItem]
    stock: list[ImportStock]


#model for discount
class DiscountStock(BaseModel):
    discount_percent: Decimal = Field(max_digits=5, decimal_places=2, ge=0,le=100)

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


#Return all stock rows from inventory
@app.get("/inventory")
def get_inventory_items(conn: DbConn):
    with conn.cursor() as cur:
        cur.execute(
            '''SELECT 
                stock.inventory_id, 
                stock.sku, 
                item.title,
                stock.quantity, 
                item.price AS original_price,
                stock.discount_percent,
                ROUND(item.price::numeric * (1 - discount_percent/100),2) AS discount_price,
                stock.shelf, 
                stock.time_added,                 stock.time_alert
            FROM inventory AS stock 
            JOIN items AS item ON stock.sku = item.sku
            ORDER BY stock.inventory_id, stock.sku;''')
        return cur.fetchall()

#Return stock rows for one inventory from inventory_id
@app.get("/inventory/{inventory_id}/items")
def get_items_in_inventory(inventory_id: str, conn: DbConn):
    with conn.cursor() as cur:
    #Verify location exits
        cur.execute("SELECT inventory_id FROM inventories WHERE inventory_id = %s",(inventory_id,))
        inventory_location = cur.fetchone()
        if not inventory_location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail = f"Inventory with id: {inventory_id} does not exits")
        #Get stock rows for inventory with matching inventory_id
        #Join item information with stock information
        cur.execute(
            '''SELECT 
                stock.inventory_id, 
                stock.sku, 
                item.title,
                stock.quantity, 
                item.price AS original_price,
                stock.discount_percent,
                ROUND(item.price::numeric * (1 - discount_percent/100),2) AS discount_price,
                stock.shelf, 
                stock.time_added,                 stock.time_alert
            FROM inventory AS stock 
            JOIN items AS item ON stock.sku = item.sku
            WHERE stock.inventory_id = %s
            ORDER BY stock.sku''', (inventory_id,))
        return cur.fetchall()

#add stock to inventory (one row per item per location).
#if the item already exists at this inventory, add to its quantity and refresh the dates.
@app.post("/inventory", status_code=status.HTTP_201_CREATED)
def add_stock(body: StockCreate, conn:DbConn):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO inventory (inventory_id, sku, quantity, shelf, time_added, time_alert) "
            "VALUES (%s, %s, %s, %s, now(), %s) "
            "ON CONFLICT (inventory_id, sku) DO UPDATE "
            "SET quantity = inventory.quantity + EXCLUDED.quantity, "
            "shelf = EXCLUDED.shelf, "
            "time_added = now(), "
            "time_alert = COALESCE(EXCLUDED.time_alert, inventory.time_alert) "
            "RETURNING inventory_id, sku, quantity, shelf, time_added, time_alert;",
            (body.inventory_id, body.sku, body.quantity, body.shelf, body.time_alert),
        )
        new_stock = cur.fetchone()
    return {"message": "Stock added successfully", "stock": new_stock}

#modify an existing stock row: set quantity and/or time_alert
@app.patch("/inventory/{inventory_id}/{sku}")
def modify_stock(inventory_id: str, sku: int, body: StockUpdate, conn: DbConn):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE inventory "
            "SET quantity = COALESCE(%s, quantity), "
            "time_alert = COALESCE(%s, time_alert) "
            "WHERE inventory_id = %s AND sku = %s "
            "RETURNING inventory_id, sku, quantity, shelf, time_added, time_alert;",
            (body.quantity, body.time_alert, inventory_id, sku),
        )
        updated_stock = cur.fetchone()
        if not updated_stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No stock found for sku {sku} at this inventory.",
            )
    return {"message": "Stock updated successfully", "stock": updated_stock}

#delete stock from inventory
@app.delete("/inventory/{inventory_id}/{sku}")
def remove_stock(inventory_id: str, sku: int, conn:DbConn):
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM inventory "
            "WHERE inventory_id = %s AND sku = %s "
            "RETURNING inventory_id, sku, quantity, shelf, time_added, time_alert;",
            (inventory_id, sku),
        )
        deleted_stock=cur.fetchone()
        if not deleted_stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No stock found for sku {sku} at this inventory.",
            )
    return {"message": "Stock removed successfully", "deleted_stock": deleted_stock}


#import inventory
@app.post("/import", status_code=status.HTTP_201_CREATED)
async def import_inventory(conn: DbConn, file: UploadFile):
    #read uploaded file bytes and parse as json
    raw = await file.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid json file",
        )
    #validate with pydantic model
    try:
        body = InventoryImport(**data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors(),
        )
    new_id = str(uuid.uuid4())
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO inventories (inventory_id, location) VALUES (%s, %s);",
            (new_id, body.location),
        )
 
        for item in body.items:
            cur.execute(
                "INSERT INTO items (sku,title,price) VALUES (%s, %s, %s) "
                "ON CONFLICT (sku) DO NOTHING;",
                (item.sku, item.title, item.price),
            )
 
        for s in body.stock:
            cur.execute(
                "INSERT INTO inventory "
                "(inventory_id, sku, quantity, shelf, time_added, time_alert) "
                "VALUES (%s, %s, %s, %s, now(), now()) "
                "ON CONFLICT (inventory_id, sku) DO UPDATE "
                "SET quantity = inventory.quantity + EXCLUDED.quantity, "
                "shelf = EXCLUDED.shelf, time_added = now(), time_alert = now();",
                (new_id, s.sku, s.quantity, s.shelf),
            )
 
        return {
            "message": "Inventory imported successfully",
            "inventory_id": new_id,
            "location": body.location,
            "items_received": len(body.items),
            "stock_rows_received": len(body.stock),
        }

#apply discount to stock
@app.patch("/inventory/{inventory_id}/{sku}/discount")
def discount_stock(conn: DbConn, inventory_id: str, sku: int, body: DiscountStock):
    with conn.cursor() as cur:
        cur.execute(
            '''
            UPDATE inventory
            SET discount_percent = %s
            WHERE inventory_id = %s AND sku = %s
            RETURNING inventory_id, sku, quantity, discount_percent; 
            ''',
            (body.discount_percent, inventory_id, sku,)
        )
        updated_stock = cur.fetchone()
        if not updated_stock:
            raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No stock found for sku {sku} at this inventory.",
                        )
        return {
            "message": "Discount Applied Successfully",
            "stock": updated_stock
        }
    