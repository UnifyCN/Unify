-- Migrate daily_tips from cohort-based (persona/stage/date) to per-user storage
-- This enables truly personalized tips based on full user profile

-- 1. Add user_id column (nullable initially for existing rows)
ALTER TABLE daily_tips ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 2. Drop old unique constraint and index
ALTER TABLE daily_tips DROP CONSTRAINT daily_tips_persona_stage_date_key;
DROP INDEX IF EXISTS idx_daily_tips_lookup;

-- 3. Add new unique constraint per user per day
ALTER TABLE daily_tips ADD CONSTRAINT daily_tips_user_date_key UNIQUE(user_id, date);

-- 4. Create index for user-specific queries
CREATE INDEX idx_daily_tips_user_lookup ON daily_tips(user_id, date DESC);

-- 5. Update RLS: users can only read their own tips
DROP POLICY IF EXISTS "Authenticated users can read tips" ON daily_tips;
CREATE POLICY "Users can read own tips"
  ON daily_tips FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 6. Allow service role to insert (edge function uses service role key)
CREATE POLICY "Service role can insert tips"
  ON daily_tips FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
