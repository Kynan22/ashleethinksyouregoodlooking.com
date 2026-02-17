-- Enable Row Level Security on all tables
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges       ENABLE ROW LEVEL SECURITY;

-- Profiles: authenticated users can read all, update only own
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Categories: full CRUD for authenticated users (shared resource)
CREATE POLICY "categories_all" ON categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Events: full CRUD for authenticated users
CREATE POLICY "events_all" ON events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Availability: full CRUD for authenticated users
CREATE POLICY "availability_all" ON availability
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Date log: full CRUD for authenticated users
CREATE POLICY "date_log_all" ON date_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bucket items: full CRUD for authenticated users
CREATE POLICY "bucket_items_all" ON bucket_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Nudges: full CRUD for authenticated users
CREATE POLICY "nudges_all" ON nudges
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
