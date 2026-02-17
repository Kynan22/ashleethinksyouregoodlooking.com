CREATE TABLE todo_lists (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text          NOT NULL UNIQUE,
  sort_order  smallint      NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything with todo_lists"
  ON todo_lists FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
