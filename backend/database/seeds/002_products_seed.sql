INSERT INTO products (slug, name, description, category, image_url, price_cents, weight_grams)
VALUES
  (
    'cafeteira-espresso-prime',
    'Cafeteira Espresso Prime',
    'Cafeteira compacta com pressão de 15 bar, ideal para café cremoso no dia a dia.',
    'Eletroportáteis',
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1000&q=80',
    79990,
    3200
  ),
  (
    'fone-bluetooth-pulse',
    'Fone Bluetooth Pulse',
    'Fone sem fio com cancelamento de ruído e bateria para até 30 horas.',
    'Eletrônicos',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
    24990,
    320
  ),
  (
    'mochila-travel-pro-35l',
    'Mochila Travel Pro 35L',
    'Mochila resistente à água com divisórias internas e encaixe para notebook.',
    'Acessórios',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
    18990,
    900
  ),
  (
    'smartwatch-active-s2',
    'Smartwatch Active S2',
    'Relógio inteligente com monitoramento cardíaco, GPS e notificações em tempo real.',
    'Eletrônicos',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    45990,
    120
  ),
  (
    'cadeira-gamer-orbit',
    'Cadeira Gamer Orbit',
    'Cadeira ergonômica com ajuste de altura, apoio lombar e inclinação de até 135 graus.',
    'Móveis',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1000&q=80',
    99990,
    15800
  ),
  (
    'kit-panelas-inox-5pcs',
    'Kit de Panelas Inox 5 Peças',
    'Conjunto de panelas em inox com fundo triplo para distribuição uniforme de calor.',
    'Casa',
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=1000&q=80',
    32990,
    4100
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  price_cents = EXCLUDED.price_cents,
  weight_grams = EXCLUDED.weight_grams,
  updated_at = NOW();

INSERT INTO inventory (product_id, quantity, reserved_quantity)
SELECT p.id,
  CASE p.slug
    WHEN 'cafeteira-espresso-prime' THEN 18
    WHEN 'fone-bluetooth-pulse' THEN 42
    WHEN 'mochila-travel-pro-35l' THEN 27
    WHEN 'smartwatch-active-s2' THEN 0
    WHEN 'cadeira-gamer-orbit' THEN 9
    WHEN 'kit-panelas-inox-5pcs' THEN 14
    ELSE 0
  END AS quantity,
  0 AS reserved_quantity
FROM products p
WHERE p.slug IN (
  'cafeteira-espresso-prime',
  'fone-bluetooth-pulse',
  'mochila-travel-pro-35l',
  'smartwatch-active-s2',
  'cadeira-gamer-orbit',
  'kit-panelas-inox-5pcs'
)
ON CONFLICT (product_id) DO UPDATE
SET
  quantity = EXCLUDED.quantity,
  reserved_quantity = EXCLUDED.reserved_quantity,
  updated_at = NOW();
