-- Script de criação do banco DeA Farma (PostgreSQL).
-- Execute como superusuário: psql -U postgres -f init-db.sql

CREATE ROLE deafarma LOGIN PASSWORD 'deafarma';
CREATE DATABASE deafarma OWNER deafarma ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE deafarma TO deafarma;

\c deafarma
GRANT ALL ON SCHEMA public TO deafarma;
ALTER SCHEMA public OWNER TO deafarma;
