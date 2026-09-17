Created doker compose and default structure for database

inventories;
| inventories_id uuid | location TEXT |



items: 
| sku BIGINT | quantity BIGINT | shelf TEXT| time_added timestamps|


docker compose properties:
port link 5432 tp 5432
volumes: inventory
env file : .env


env file:
make sure to create a .env file in database directory. The example env should be found in .env-example


command
in database folder: 
docker compose up --build

to stop:
docker compose down

to stop and delete volume:
docker compose down -v


# fake data for development environment
to create database with fake items and inventories:
Run the following in /database

docker compose -f docker-compose_test.yaml up --build

to stop: 
docker compose -f docker-compose_test.yaml down


