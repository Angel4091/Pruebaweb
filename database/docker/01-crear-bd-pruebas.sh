#!/bin/sh
# Se ejecuta solo la primera vez que se crea el volumen de PostgreSQL.
# Crea la base de datos que usan las pruebas (npm test), separada de la de desarrollo.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  create database "${DB_NAME_TEST:-origenes_test}" owner "$POSTGRES_USER";
EOSQL
