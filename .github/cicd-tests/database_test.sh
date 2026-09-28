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



inventories_test=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -t -A -q -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT count(*) FROM inventories;")

if [ "$inventories_test" -gt 0 ] 2>/dev/null; then
    echo "There are: $inventories_test records"
else
    echo "Failed to get records from test database"
    exit 1
fi


items=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -t -A -q -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT count(*) FROM items;")

if [ "$items" -gt 0 ] 2>/dev/null; then
    echo "There are: $items records"
else
    echo "Failed to get item records from test database"
    exit 1
fi

inventory_test=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -t -A -q -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT count(*) FROM inventory;")

if [ "$inventory_test" -gt 0 ] 2>/dev/null; then
    echo "There are: $inventory_test records"
else
    echo "Failed to get item records from test database"
    exit 1
fi

echo "CHECKING CONSTRAINTS ..."

inventory_foreign=$( \
PGPASSWORD="$POSTGRES_PASSWORD" \
psql -t -A -q -h "$POSTGRES_HOST" \
-U "$POSTGRES_USER" -d "$POSTGRES_DB" \
-p "$POSTGRES_PORT" \
-c "SELECT constraint_name constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
          AND table_name = 'inventory';")


if [ $? -ne 0 ]; then
    echo "Failed to retrieve inventory indexes."
    exit 1
fi

# if [ "$inventory_foreign" != "inventory_key" ]; then
#     echo "Invalid inventory constraint"
#     exit 1
# fi

echo "CHECKING INDEXES ..."

inventory_index=$( \
PGPASSWORD="$POSTGRES_PASSWORD" \
psql -t -A -q -h "$POSTGRES_HOST" \
-U "$POSTGRES_USER" -d "$POSTGRES_DB" \
-p "$POSTGRES_PORT" \
-c"SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'inventory';"   )

if [ $? -ne 0 ]; then
    echo "Failed to retrieve inventory indexes."
    exit 1
fi

# if [ "$inventory_index" != "item_idx" ]; then
#     echo "Invalid inventory index"
#     exit 1
# fi
exit 0
