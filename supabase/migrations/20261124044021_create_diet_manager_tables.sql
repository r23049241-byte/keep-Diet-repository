/*
# Create diet manager tables (single-tenant, no auth)

1. New Tables
- `profile` — a single row storing the user's diet profile (age, sex, height, weight, activity, goal, target_calories, target_protein, target_carbs, target_fat). Used to personalize the AI dietitian's advice.
- `meals` — food/meal entries logged by the user with name, meal_type (breakfast/lunch/dinner/snack), calories, protein, carbs, fat, and logged_at timestamp.
- `chat_messages` — conversation history with the AI diet assistant: role (user/assistant) and content.

2. Security
- This is a single-tenant app with no sign-in screen, so all policies use `TO anon, authenticated` and allow full CRUD (the data is intentionally shared/public on this project).
- RLS enabled on all three tables.
- Grants: SELECT, INSERT, UPDATE, DELETE on all tables to anon + authenticated.

3. Notes
- `profile` holds at most one row (enforced by a unique index on a constant `singleton` column) so the app can upsert a single profile.
- `meals.logged_at` defaults to now() so entries sort newest-first without client-provided timestamps.
*/

CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton int NOT NULL DEFAULT 1,
  name text NOT NULL DEFAULT 'You',
  age int,
  sex text,
  height_cm numeric,
  weight_kg numeric,
  activity text,
  goal text,
  target_calories numeric,
  target_protein numeric,
  target_carbs numeric,
  target_fat numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON profile TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_profile" ON profile;
CREATE POLICY "anon_select_profile" ON profile FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
CREATE POLICY "anon_insert_profile" ON profile FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profile" ON profile;
CREATE POLICY "anon_update_profile" ON profile FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profile" ON profile;
CREATE POLICY "anon_delete_profile" ON profile FOR DELETE
TO anon, authenticated USING (true);

-- Enforce a single profile row
DROP INDEX IF EXISTS profile_singleton_idx;
CREATE UNIQUE INDEX profile_singleton_idx ON profile (singleton);

CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  meal_type text NOT NULL DEFAULT 'snack',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_meals" ON meals;
CREATE POLICY "anon_select_meals" ON meals FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meals" ON meals;
CREATE POLICY "anon_insert_meals" ON meals FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meals" ON meals;
CREATE POLICY "anon_update_meals" ON meals FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meals" ON meals;
CREATE POLICY "anon_delete_meals" ON meals FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS meals_logged_at_idx ON meals (logged_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON chat_messages TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages (created_at ASC);
