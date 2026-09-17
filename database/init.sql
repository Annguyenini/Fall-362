CREATE TABLE IF NOT EXISTS inventories (
    inventory_id uuid PRIMARY KEY,
    location TEXT
);
CREATE TABLE IF NOT EXISTS items(
    sku BIGINT PRIMARY KEY,
    title TEXT,
    price NUMERIC (18,2) NOT NULL
    );
CREATE TABLE IF NOT EXISTS inventory_test(
    sku BIGINT,
    batch_id BIGINT,
    quantity BIGINT,
    shelf TEXT,
    -- timestamptz is absolute moment/ UTC
    time_added timestamptz,
    time_alert timestamptz
    -- time alert using for discount
    )
