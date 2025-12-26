CREATE TABLE IF NOT EXISTS gacha_items (
  id BIGSERIAL PRIMARY KEY,
  rarity TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gacha_items_rarity_idx ON gacha_items (rarity);

INSERT INTO gacha_items (rarity, title, caption)
VALUES
  ('common', 'Selfie Blur', 'Foto blur tapi tetep bikin ketawa.'),
  ('common', 'Muka Ngantuk', 'Ekspresi paling lucu pas nunggu pesanan.'),
  ('common', 'Pose Aneh', 'Pose random yang malah jadi favorit.'),
  ('common', 'Candid Chaos', 'Momen konyol yang bikin ketawa terus.'),
  ('rare', 'Dinner Date', 'Makan enak sambil ketawa bareng.'),
  ('rare', 'Trip Singkat', 'Jalan-jalan kecil yang selalu bikin rindu.'),
  ('rare', 'Coffee Break', 'Momen santai favorit kita.'),
  ('legendary', 'First Date', 'Hari pertama yang bikin semuanya dimulai.'),
  ('legendary', 'Anniversary Night', 'Momen paling romantis kita.'),
  ('legendary', 'Christmas Kiss', 'Hadiah terbaik di malam Natal.')
ON CONFLICT DO NOTHING;
