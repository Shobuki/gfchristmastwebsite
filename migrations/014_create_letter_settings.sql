CREATE TABLE IF NOT EXISTS letter_settings (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body1 TEXT NOT NULL,
  body2 TEXT NOT NULL,
  voucher TEXT NOT NULL,
  button_text TEXT NOT NULL,
  footer TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO letter_settings (
  id,
  title,
  body1,
  body2,
  voucher,
  button_text,
  footer
)
VALUES (
  1,
  'Untukmu, Sayang',
  'Placeholder love letter. Tulis di sini semua hal yang bikin kamu bersyukur bertemu dia, bagaimana dia membuat harimu hangat, dan rencana kecil kalian untuk tahun berikutnya.',
  'Tambahkan detail tentang momen Natal, aroma cokelat panas, dan betapa spesialnya ulang tahun ini karena dia ada di sisimu.',
  'LOVE-ANNIV-2025',
  'Redeem Gift',
  'Merry Christmas & Happy Anniversary'
)
ON CONFLICT (id) DO NOTHING;
