CREATE TABLE IF NOT EXISTS inventories (
    inventory_id uuid PRIMARY KEY,
    location TEXT
);
CREATE TABLE IF NOT EXISTS items(
    sku BIGINT PRIMARY KEY,
    title TEXT,
    price NUMERIC (18,2) NOT NULL
    )
