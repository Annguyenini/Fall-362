CREATE TABLE IF NOT EXISTS inventories (
    inventory_id uuid PRIMARY KEY,
    location TEXT
);
CREATE TABLE IF NOT EXISTS items(
    sku BIGINT PRIMARY KEY,
    title TEXT,
    price NUMERIC (18,2) NOT NULL
    );
CREATE TABLE IF NOT EXISTS inventory(
    inventory_id uuid,
    sku BIGINT,
    batch_id BIGINT,
    quantity BIGINT,
    shelf TEXT,
    -- timestamptz is absolute moment/ UTC
    -- time alert using for discount
    time_added timestamptz,
    time_alert timestamptz,
    -- CONSTRANT
    CONSTRAINT inventory_key FOREIGN KEY(inventory_id) REFERENCES inventories (inventory_id)
    );
-- create index
CREATE INDEX item_idx ON inventory (inventory_id,sku)
