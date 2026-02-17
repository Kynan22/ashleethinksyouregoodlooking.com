CREATE TABLE availability (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  person     person_enum   NOT NULL,
  free_date  date          NOT NULL,
  start_time time          NOT NULL DEFAULT '00:00',
  end_time   time          NOT NULL DEFAULT '23:59',
  created_at timestamptz   NOT NULL DEFAULT now(),
  UNIQUE(person, free_date, start_time)
);
