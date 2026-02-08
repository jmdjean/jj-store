INSERT INTO product_categories (name, slug)
VALUES
  ('Acessórios', 'acessorios'),
  ('Alimentos', 'alimentos'),
  ('Beleza', 'beleza'),
  ('Brinquedos', 'brinquedos'),
  ('Casa e Cozinha', 'casa-e-cozinha'),
  ('Eletrônicos', 'eletronicos'),
  ('Esportes', 'esportes'),
  ('Livros', 'livros'),
  ('Moda e Roupas', 'moda-e-roupas'),
  ('Pet Shop', 'pet-shop'),
  ('Saúde e Bem-estar', 'saude-e-bem-estar'),
  ('Tecnologia', 'tecnologia')
ON CONFLICT (name) DO NOTHING;
