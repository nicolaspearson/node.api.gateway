BEGIN;

INSERT INTO "auth"."user" (id, first_name, last_name, username, password, email_address, enabled) VALUES
(1, 'Admin', 'User', 'admin', '$2a$10$/s3X8BwB3WWhlJf1pusocumnwYdo3e3Y41pT.qiQ.1qCEHeIedsri', 'admin@devenv.com', true),
(2, 'Nic', 'Dev', 'nic', '$2a$10$149kqNNXB4rfUI3QUceAsOdh.0NgPTYaQsTs.lxE1eUgASoTsUT3S', 'nic@devenv.com', true);

SELECT setval(pg_get_serial_sequence('auth.user', 'id'), (SELECT MAX(id) FROM auth.user));

INSERT INTO "auth"."role" (id, "name", "value") VALUES
(1, 'administrator', 'admin'),
(2, 'user', 'user');

SELECT setval(pg_get_serial_sequence('auth.role', 'id'), (SELECT MAX(id) FROM auth.role));

INSERT INTO "auth"."user_role" (user_id, role_id) VALUES
(1, 1),
(2, 2);

COMMIT;
