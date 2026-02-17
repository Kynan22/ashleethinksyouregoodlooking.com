-- Create the person enum and profiles table
-- Run this AFTER creating auth users in Supabase dashboard
CREATE TYPE person_enum AS ENUM ('kynan', 'ashlee');

CREATE TABLE profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  person       person_enum NOT NULL UNIQUE,
  display_name text        NOT NULL,
  color_hue    smallint    NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- After creating auth users, insert profiles:
-- INSERT INTO profiles (id, person, display_name, color_hue) VALUES
--   ('<kynan-auth-uuid>', 'kynan', 'Kynan', 210),
--   ('<ashlee-auth-uuid>', 'ashlee', 'Ashlee', 345);
