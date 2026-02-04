INSERT INTO users (role, username, email, password_hash)
VALUES (
  'ADMIN',
  'admin',
  'admin@jjstore.local',
  '$2a$10$CV7/B7lCVWI4op7nn91/w.Z/qOjiJ3n.LRRHGqVirIWqSWe71sSe2'
)
ON CONFLICT (username) DO NOTHING;
