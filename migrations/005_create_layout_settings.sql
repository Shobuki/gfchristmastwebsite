CREATE TABLE IF NOT EXISTS layout_settings (
  id INTEGER PRIMARY KEY,
  journey_columns INTEGER NOT NULL,
  gacha_columns INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO layout_settings (id, journey_columns, gacha_columns)
VALUES (1, 2, 2)
ON CONFLICT (id) DO NOTHING;
