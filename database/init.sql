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
    quantity BIGINT,
    shelf TEXT,

    -- Warehouse Specific Discount: 0 means no discount
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
    -- timestamptz is absolute moment/ UTC
    -- time alert using for discount
    time_added timestamptz,
    time_alert timestamptz,
    -- CONSTRANT
    CONSTRAINT inventory_key FOREIGN KEY(inventory_id) REFERENCES inventories (inventory_id) ON DELETE CASCADE,
    CONSTRAINT inventory_identity UNIQUE (inventory_id, sku)
    );
CREATE INDEX item_idx ON inventory (inventory_id, sku);
