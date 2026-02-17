CREATE TABLE events (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner       person_enum   NOT NULL,
  category_id uuid          NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title       text          NOT NULL,
  event_date  date          NOT NULL,
  start_time  time,
  end_time    time,
  notes       text,
  is_shared   boolean       NOT NULL DEFAULT false,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);
