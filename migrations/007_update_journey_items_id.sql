CREATE SEQUENCE IF NOT EXISTS journey_items_id_seq;

ALTER TABLE journey_items
ALTER COLUMN id SET DEFAULT nextval('journey_items_id_seq');

SELECT setval('journey_items_id_seq', COALESCE((SELECT MAX(id) FROM journey_items), 1), true);
