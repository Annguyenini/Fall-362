#!/bin/bash
wait_max=10
until pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT"; do
    echo "waiting... $wait_max"

    wait_max=$((wait_max-1))
    if [ "$wait_max" -eq 0 ]; then
        echo "Database not respond. Reach max time wait."
        exit 1
    fi
    sleep 1
done

all_tables=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -t -A -q \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -p "$POSTGRES_PORT" \
    -c "SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';")
echo "$all_tables"



inventories_test=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -t -A -q -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT count(*) FROM inventories;")

if [ "$inventories_test" -gt 0 ] 2>/dev/null; then
    echo "There are: $inventories_test records"
else
    echo "Failed to get records from test database"
    exit 1
fi


items=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -t -A -q -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT count(*) FROM items;")
echo "$items"

if [ "$items" -gt 0 ] 2>/dev/null; then
    echo "There are: $items records"
else
    echo "Failed to get item records from test database"
    exit 1
fi

inventory_test=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -t -A -q -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT count(*) FROM inventory_test;")
echo "$inventory_test"

if [ "$inventory_test" -gt 0 ] 2>/dev/null; then
    echo "There are: $inventory_test records"
else
    echo "Failed to get item records from test database"
    exit 1
fi

echo "PASS"
exit 0
