-- The database is created by the docker-compose.yml
-- entrypoint using the credentials specified in the env varaibles
SET search_path TO lupinemoon;
CREATE SCHEMA IF NOT EXISTS auth;

BEGIN;

CREATE TABLE IF NOT EXISTS auth.role (
	id SERIAL NOT NULL,
	"name" character varying(255),
	"value" character varying(255),
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMP DEFAULT NULL,
	PRIMARY KEY (id)
);

COMMIT;

BEGIN;

CREATE TABLE IF NOT EXISTS auth.user (
	id SERIAL NOT NULL,
	first_name varchar(255) DEFAULT NULL,
	last_name varchar(255) DEFAULT NULL,
    username varchar(255) DEFAULT NULL,
    password varchar(255) DEFAULT NULL,
	email_address varchar(255) DEFAULT NULL,
	last_logged_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
	enabled boolean default false,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMP DEFAULT NULL,
	PRIMARY KEY (id)
);

COMMIT;

BEGIN;

CREATE TABLE IF NOT EXISTS auth.user_role (
	user_id bigint NOT NULL,
	role_id bigint NOT NULL,
	PRIMARY KEY (user_id, role_id)
);

COMMIT;

CREATE SCHEMA IF NOT EXISTS registration;

BEGIN;


CREATE TABLE IF NOT EXISTS registration.contact_us (
	id SERIAL NOT NULL,
	first_name character varying(255),
	last_name character varying(255),
	email_address character varying(255),
	"message" character varying,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMP DEFAULT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS registration.early_access (
	id SERIAL NOT NULL,
	email_address character varying(255),
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMP DEFAULT NULL,
	PRIMARY KEY (id)
);

COMMIT;
