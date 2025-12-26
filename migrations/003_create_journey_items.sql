CREATE TABLE IF NOT EXISTS journey_items (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  filename TEXT,
  stored_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS journey_items_category_idx ON journey_items (category);

INSERT INTO journey_items (id, category, title, caption)
VALUES
  (1, 'sweet', 'Memory 1', 'Saat kita jalan malam Natal dan salju turun pelan.'),
  (2, 'sweet', 'Memory 2', 'Kamu tersenyum sambil pegang hadiah yang aku bungkus.'),
  (3, 'sweet', 'Memory 3', 'Momen pertama kali kita bilang “I love you”.'),
  (4, 'funny', 'Funny 1', 'Wajah kita saat nyasar cari kafe jam 11 malam.'),
  (5, 'funny', 'Funny 2', 'Kamu ketiduran pas filmnya baru 10 menit.'),
  (6, 'funny', 'Funny 3', 'Selfie paling random tapi selalu favoritku.')
ON CONFLICT (id) DO NOTHING;
