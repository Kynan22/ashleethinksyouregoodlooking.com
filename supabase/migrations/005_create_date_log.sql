CREATE TABLE date_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid        REFERENCES events(id) ON DELETE SET NULL,
  date_date  date        NOT NULL,
  title      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
