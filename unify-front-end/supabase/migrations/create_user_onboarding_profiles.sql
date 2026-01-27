-- Migration: Create user_onboarding_profiles table
-- Description: Stores user onboarding quiz responses for AI personalization
-- This table is used by the rag-query edge function to personalize AI responses

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_onboarding_profiles (
  -- Primary key linked to auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User persona/immigration status
  persona TEXT CHECK (persona IN ('international_student', 'skilled_worker', 'refugee', 'other')),
  persona_other TEXT, -- Custom text if persona = 'other'
  
  -- Time spent in Canada
  time_in_canada TEXT CHECK (time_in_canada IN ('not_arrived', 'less_than_1_year', '1_to_2_years', '2_to_3_years', '3_plus_years')),
  
  -- User goals (array of goal types)
  goals TEXT[] DEFAULT '{}',
  goals_other TEXT, -- Custom text if goals includes 'something_else'
  
  -- Learning interests (array of topic types)
  learning_interests TEXT[] DEFAULT '{}',
  learning_interests_other TEXT, -- Custom text if learning_interests includes 'other'
  
  -- Hobbies and personal interests (array)
  hobbies TEXT[] DEFAULT '{}',
  
  -- Onboarding completion tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE user_onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own onboarding profile
CREATE POLICY "Users can view their own onboarding profile"
  ON user_onboarding_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own onboarding profile
CREATE POLICY "Users can insert their own onboarding profile"
  ON user_onboarding_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own onboarding profile
CREATE POLICY "Users can update their own onboarding profile"
  ON user_onboarding_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own onboarding profile
CREATE POLICY "Users can delete their own onboarding profile"
  ON user_onboarding_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for faster lookups by persona type
CREATE INDEX IF NOT EXISTS idx_user_onboarding_profiles_persona 
  ON user_onboarding_profiles(persona);

-- Index for faster lookups by time in Canada
CREATE INDEX IF NOT EXISTS idx_user_onboarding_profiles_time_in_canada 
  ON user_onboarding_profiles(time_in_canada);

-- Index for filtering by onboarding completion status
CREATE INDEX IF NOT EXISTS idx_user_onboarding_profiles_onboarding_completed 
  ON user_onboarding_profiles(onboarding_completed);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on UPDATE
DROP TRIGGER IF EXISTS trigger_update_user_onboarding_profiles_updated_at 
  ON user_onboarding_profiles;
  
CREATE TRIGGER trigger_update_user_onboarding_profiles_updated_at
  BEFORE UPDATE ON user_onboarding_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_profiles_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_onboarding_profiles IS 
  'Stores user onboarding quiz responses for AI companion personalization';

COMMENT ON COLUMN user_onboarding_profiles.persona IS 
  'User immigration status: international_student, skilled_worker, refugee, or other';

COMMENT ON COLUMN user_onboarding_profiles.time_in_canada IS 
  'How long the user has been in Canada';

COMMENT ON COLUMN user_onboarding_profiles.goals IS 
  'Array of user goals: learn_something, build_community, quick_answers, something_else';

COMMENT ON COLUMN user_onboarding_profiles.learning_interests IS 
  'Array of topics user wants to learn about: documents, employment, finance, housing, etc.';

COMMENT ON COLUMN user_onboarding_profiles.hobbies IS 
  'Array of user hobbies: career_growth, exploring_canada, wellness, technology, etc.';
