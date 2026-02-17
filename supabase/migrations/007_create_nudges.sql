CREATE TABLE nudges (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person person_enum   NOT NULL,
  to_person   person_enum   NOT NULL,
  message     text          NOT NULL,
  nudge_type  text          NOT NULL DEFAULT 'date_idea',
  read_at     timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now()
);
