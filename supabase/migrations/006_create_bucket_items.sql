CREATE TABLE bucket_items (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text          NOT NULL,
  description text,
  added_by    person_enum   NOT NULL,
  is_done     boolean       NOT NULL DEFAULT false,
  done_date   date,
  sort_order  smallint      NOT NULL DEFAULT 0,
  category    text          NOT NULL DEFAULT 'general',
  created_at  timestamptz   NOT NULL DEFAULT now()
);
