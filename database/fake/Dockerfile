
FROM postgres:15
COPY ./init.sql /docker-entrypoint-initdb.d/01init.sql
COPY ./fake_data.sh /docker-entrypoint-initdb.d/02fake_data.sh
RUN chmod +x /docker-entrypoint-initdb.d/02fake_data.sh
## make docker ran 2 scripts
