ALTER TABLE gacha_state RENAME TO gacha_state_legacy;

CREATE TABLE IF NOT EXISTS gacha_state (
  admin_id INTEGER PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gacha_state (admin_id)
SELECT id FROM admins
ON CONFLICT (admin_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS gacha_results (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  gacha_item_id INTEGER NOT NULL REFERENCES gacha_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_id, gacha_item_id)
);
