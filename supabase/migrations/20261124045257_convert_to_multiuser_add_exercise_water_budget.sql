/*
# Convert to multi-user auth + add exercise, water, budget, expense tables

## Summary
Transforms the app from single-tenant to multi-user with auth.
All existing tables get user_id scoped to authenticated owner. New tables for exercises, water, budget, expenses.

## Changes to existing tables
1. profile — drop singleton constraint, add user_id. Each user has own profile row.
2. meals — add user_id, add cost numeric column for budget tracking.
3. chat_messages — add user_id.
All policies converted to authenticated owner-scoped.

## New tables
4. exercises — workout sessions: type, duration_minutes, calories_burned, logged_at.
5. water_intake — water log entries in ml.
6. budget — monthly food budget: one row per user per month.
7. expenses — food expense entries with amount, category, note, date.

## Security
- RLS on ALL tables. Policies TO authenticated with auth.uid() = user_id.
- user_id defaults to auth.uid(). Grants to authenticated + service_role only.
*/

-- ============ profile ============
DROP INDEX IF EXISTS profile_singleton_idx;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile' AND column_name = 'user_id') THEN
    ALTER TABLE profile ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_profile" ON profile;
DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
DROP POLICY IF EXISTS "anon_update_profile" ON profile;
DROP POLICY IF EXISTS "anon_delete_profile" ON profile;

GRANT SELECT, INSERT, UPDATE, DELETE ON profile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profile TO service_role;

CREATE POLICY "select_own_profile" ON profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_profile" ON profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_profile" ON profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_profile" ON profile FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ meals ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meals' AND column_name = 'user_id') THEN
    ALTER TABLE meals ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meals' AND column_name = 'cost') THEN
    ALTER TABLE meals ADD COLUMN cost numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_meals" ON meals;
DROP POLICY IF EXISTS "anon_insert_meals" ON meals;
DROP POLICY IF EXISTS "anon_update_meals" ON meals;
DROP POLICY IF EXISTS "anon_delete_meals" ON meals;

GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO service_role;

CREATE POLICY "select_own_meals" ON meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_meals" ON meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_meals" ON meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_meals" ON meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meals_user_logged_idx ON meals (user_id, logged_at DESC);

-- ============ chat_messages ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'user_id') THEN
    ALTER TABLE chat_messages ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;

GRANT SELECT, INSERT, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON chat_messages TO service_role;

CREATE POLICY "select_own_chat" ON chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_chat" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_chat" ON chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_user_created_idx ON chat_messages (user_id, created_at ASC);

-- ============ exercises ============
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  calories_burned numeric NOT NULL DEFAULT 0,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercises TO service_role;

CREATE POLICY "select_own_exercises" ON exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_exercises" ON exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_exercises" ON exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_exercises" ON exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exercises_user_logged_idx ON exercises (user_id, logged_at DESC);

-- ============ water_intake ============
CREATE TABLE IF NOT EXISTS water_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml int NOT NULL DEFAULT 250,
  logged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON water_intake TO authenticated;
GRANT SELECT, INSERT, DELETE ON water_intake TO service_role;

CREATE POLICY "select_own_water" ON water_intake FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_water" ON water_intake FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_water" ON water_intake FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS water_user_logged_idx ON water_intake (user_id, logged_at DESC);

-- ============ budget ============
CREATE TABLE IF NOT EXISTS budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL DEFAULT EXTRACT(year FROM now())::int,
  month int NOT NULL DEFAULT EXTRACT(month FROM now())::int,
  budget_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budget ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON budget TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget TO service_role;

CREATE POLICY "select_own_budget" ON budget FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_budget" ON budget FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_budget" ON budget FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_budget" ON budget FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS budget_user_month_idx ON budget (user_id, year, month);

-- ============ expenses ============
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'food',
  note text NOT NULL DEFAULT '',
  spent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO service_role;

CREATE POLICY "select_own_expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS expenses_user_spent_idx ON expenses (user_id, spent_at DESC);
