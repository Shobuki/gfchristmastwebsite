CREATE TABLE IF NOT EXISTS pictures (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size INTEGER,
  stored_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pictures_created_at_idx ON pictures (created_at DESC);
