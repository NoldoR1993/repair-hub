INSERT INTO users (username, password_hash, role, display_name)
VALUES
  ('admin', '$2a$10$Fc3m0KoGFvXX0ROfjg2N3u2fbIqqtOspo51xYqOapIKbzSyMw4/EW', 'dispatcher', 'Главный диспетчер'),
  ('worker1', '$2a$10$R/IxIl3GJS7C3wEAQqcjHOUJer1P1j.xZzYhhZnObuJCS/KwsLU7K', 'master', 'Мастер 1'),
  ('worker2', '$2a$10$R/IxIl3GJS7C3wEAQqcjHOUJer1P1j.xZzYhhZnObuJCS/KwsLU7K', 'master', 'Мастер 2')
ON CONFLICT (username) DO NOTHING;
