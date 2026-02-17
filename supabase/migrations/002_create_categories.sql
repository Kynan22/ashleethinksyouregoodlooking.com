CREATE TABLE categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  icon       text        NOT NULL DEFAULT 'calendar',
  color      text        NOT NULL DEFAULT '#E85D75',
  owner      person_enum,
  sort_order smallint    NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO categories (name, icon, color, owner) VALUES
  ('Date',     'heart',        '#E85D75', NULL),
  ('Work',     'briefcase',    '#6B7280', NULL),
  ('Social',   'users',        '#8B5CF6', NULL),
  ('Exercise', 'dumbbell',     '#10B981', NULL),
  ('Errand',   'shopping-bag', '#F59E0B', NULL),
  ('Free',     'coffee',       '#06B6D4', NULL);
