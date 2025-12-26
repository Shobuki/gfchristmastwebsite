ALTER TABLE pictures
ADD COLUMN IF NOT EXISTS gacha_id INTEGER;

CREATE INDEX IF NOT EXISTS pictures_gacha_id_idx ON pictures (gacha_id);
