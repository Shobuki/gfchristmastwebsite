CREATE TABLE IF NOT EXISTS cosmic_settings (
  id INTEGER PRIMARY KEY,
  intro_title TEXT NOT NULL,
  intro_subtitle TEXT NOT NULL,
  timeline_title TEXT NOT NULL,
  date1 TEXT NOT NULL,
  caption1 TEXT NOT NULL,
  date2 TEXT NOT NULL,
  caption2 TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cosmic_settings (
  id,
  intro_title,
  intro_subtitle,
  timeline_title,
  date1,
  caption1,
  date2,
  caption2
)
VALUES (
  1,
  'Our Journey through Time & Space',
  'Kisah kita di antara bintang, nebula, dan jokes receh yang bikin kita ketawa.',
  'The Emotional Rollercoaster',
  '2023-05-20',
  'Di tanggal ini, semesta sibuk melihat nebula yang indah ini. Tapi di bumi, duniaku baru aja dimulai pas ketemu kamu.',
  '2024-05-20',
  'Satu tahun kemudian, bintang ini mungkin udah bergeser. Tapi perasaanku ke kamu tetap di orbit yang sama.'
)
ON CONFLICT (id) DO NOTHING;
