CREATE TABLE IF NOT EXISTS gacha_rarity_settings (
  rarity TEXT PRIMARY KEY,
  weight INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gacha_rarity_settings (rarity, weight)
VALUES
  ('common', 55),
  ('rare', 25),
  ('epic', 12),
  ('legendary', 6),
  ('mythic', 2)
ON CONFLICT (rarity) DO NOTHING;
