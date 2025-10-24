-- =============================================
-- USER PROGRESS TRACKING SCHEMA
-- Compatible with Sanity CMS Content Structure
-- =============================================

-- =============================================
-- CORE PROGRESS TRACKING TABLES
-- =============================================

-- User progress for modules
CREATE TABLE user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_module_id TEXT NOT NULL, -- References Sanity module._id
  progress_percent DECIMAL(5,2) DEFAULT 0.00,
  total_pages INTEGER DEFAULT 0,
  completed_pages INTEGER DEFAULT 0,
  total_submodules INTEGER DEFAULT 0,
  completed_submodules INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_module_id)
);

-- User progress for submodules
CREATE TABLE user_submodule_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_submodule_id TEXT NOT NULL, -- References Sanity submodule._id
  sanity_module_id TEXT NOT NULL, -- For easier querying
  progress_percent DECIMAL(5,2) DEFAULT 0.00,
  total_pages INTEGER DEFAULT 0,
  completed_pages INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_submodule_id)
);

-- User progress for lessons
CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_lesson_id TEXT NOT NULL, -- References Sanity lesson._id
  sanity_submodule_id TEXT NOT NULL, -- For easier querying
  sanity_module_id TEXT NOT NULL, -- For easier querying
  progress_percent DECIMAL(5,2) DEFAULT 0.00,
  total_pages INTEGER DEFAULT 0,
  completed_pages INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_in_progress BOOLEAN DEFAULT FALSE, -- Currently being worked on
  current_page_type TEXT CHECK (current_page_type IN ('intro', 'lesson', 'activity', 'quiz')),
  current_page_number INTEGER DEFAULT 1,
  current_quiz_id TEXT, -- Current quiz being taken
  current_question_number INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_lesson_id)
);

-- =============================================
-- DETAILED PAGE PROGRESS TRACKING
-- =============================================

-- Track individual page visits and completions
CREATE TABLE user_page_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_lesson_id TEXT NOT NULL,
  sanity_submodule_id TEXT NOT NULL,
  sanity_module_id TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('intro', 'lesson', 'activity', 'quiz')),
  page_key TEXT NOT NULL, -- e.g., 'intro_1', 'lesson_2', 'activity_1', 'quiz_1_question_3'
  page_number INTEGER NOT NULL,
  sanity_quiz_id TEXT, -- For quiz pages
  question_number INTEGER, -- For quiz question pages
  is_visited BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  first_visited_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_lesson_id, page_type, page_key)
);

-- =============================================
-- QUIZ-SPECIFIC PROGRESS
-- =============================================

-- Track quiz attempts and scores
CREATE TABLE user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_quiz_id TEXT NOT NULL, -- References Sanity quiz._id
  sanity_lesson_id TEXT NOT NULL,
  sanity_submodule_id TEXT NOT NULL,
  sanity_module_id TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  score_percent DECIMAL(5,2),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  is_passed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_quiz_id, attempt_number)
);

-- Track individual quiz question responses
CREATE TABLE user_quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_attempt_id UUID NOT NULL REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
  sanity_question_id TEXT NOT NULL, -- References Sanity question._key
  question_type TEXT NOT NULL,
  user_answer JSONB, -- Store the user's answer(s) as JSON
  is_correct BOOLEAN,
  time_spent_seconds INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_attempt_id, sanity_question_id)
);

-- =============================================
-- ACTIVITY INPUT TRACKING
-- =============================================

-- Track user input in activity pages
CREATE TABLE user_activity_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_lesson_id TEXT NOT NULL,
  sanity_submodule_id TEXT NOT NULL,
  sanity_module_id TEXT NOT NULL,
  activity_page_key TEXT NOT NULL, -- e.g., 'activity_1'
  input_field_key TEXT NOT NULL, -- References Sanity input field._key
  input_value TEXT,
  is_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_lesson_id, activity_page_key, input_field_key)
);

-- =============================================
-- RETAKES AND REVISITS
-- =============================================

-- Track lesson retakes (when user revisits completed content)
CREATE TABLE user_lesson_retakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanity_lesson_id TEXT NOT NULL,
  sanity_submodule_id TEXT NOT NULL,
  sanity_module_id TEXT NOT NULL,
  retake_number INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE, -- Currently retaking this lesson
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sanity_lesson_id, retake_number)
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- User-based indexes
CREATE INDEX idx_user_module_progress_user_id ON user_module_progress(user_id);
CREATE INDEX idx_user_submodule_progress_user_id ON user_submodule_progress(user_id);
CREATE INDEX idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX idx_user_page_progress_user_id ON user_page_progress(user_id);
CREATE INDEX idx_user_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX idx_user_activity_inputs_user_id ON user_activity_inputs(user_id);
CREATE INDEX idx_user_lesson_retakes_user_id ON user_lesson_retakes(user_id);

-- Sanity ID indexes for efficient lookups
CREATE INDEX idx_user_module_progress_sanity_id ON user_module_progress(sanity_module_id);
CREATE INDEX idx_user_submodule_progress_sanity_id ON user_submodule_progress(sanity_submodule_id);
CREATE INDEX idx_user_lesson_progress_sanity_id ON user_lesson_progress(sanity_lesson_id);
CREATE INDEX idx_user_page_progress_sanity_lesson_id ON user_page_progress(sanity_lesson_id);
CREATE INDEX idx_user_quiz_attempts_sanity_quiz_id ON user_quiz_attempts(sanity_quiz_id);
CREATE INDEX idx_user_activity_inputs_sanity_lesson_id ON user_activity_inputs(sanity_lesson_id);

-- Active retakes index
CREATE INDEX idx_user_lesson_retakes_active ON user_lesson_retakes(user_id, is_active) WHERE is_active = TRUE;

-- In-progress lessons index
CREATE INDEX idx_user_lesson_progress_in_progress ON user_lesson_progress(user_id, is_in_progress) WHERE is_in_progress = TRUE;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_submodule_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_page_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_retakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own module progress" ON user_module_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own submodule progress" ON user_submodule_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own lesson progress" ON user_lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own page progress" ON user_page_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own quiz attempts" ON user_quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own quiz responses" ON user_quiz_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own activity inputs" ON user_activity_inputs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own lesson retakes" ON user_lesson_retakes FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_user_module_progress_updated_at BEFORE UPDATE ON user_module_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_submodule_progress_updated_at BEFORE UPDATE ON user_submodule_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_lesson_progress_updated_at BEFORE UPDATE ON user_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_page_progress_updated_at BEFORE UPDATE ON user_page_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_activity_inputs_updated_at BEFORE UPDATE ON user_activity_inputs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS FOR PROGRESS CALCULATION
-- =============================================

-- Function to calculate lesson progress percentage
CREATE OR REPLACE FUNCTION calculate_lesson_progress(
  p_user_id UUID,
  p_sanity_lesson_id TEXT
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_pages INTEGER;
  completed_pages INTEGER;
  progress_percent DECIMAL(5,2);
BEGIN
  -- Get total pages for this lesson
  SELECT COUNT(*) INTO total_pages
  FROM user_page_progress
  WHERE user_id = p_user_id 
    AND sanity_lesson_id = p_sanity_lesson_id;
  
  -- Get completed pages
  SELECT COUNT(*) INTO completed_pages
  FROM user_page_progress
  WHERE user_id = p_user_id 
    AND sanity_lesson_id = p_sanity_lesson_id
    AND is_completed = TRUE;
  
  -- Calculate percentage
  IF total_pages > 0 THEN
    progress_percent := (completed_pages::DECIMAL / total_pages::DECIMAL) * 100;
  ELSE
    progress_percent := 0;
  END IF;
  
  RETURN progress_percent;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate submodule progress percentage
CREATE OR REPLACE FUNCTION calculate_submodule_progress(
  p_user_id UUID,
  p_sanity_submodule_id TEXT
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_pages INTEGER;
  completed_pages INTEGER;
  progress_percent DECIMAL(5,2);
BEGIN
  -- Get total pages for this submodule
  SELECT COUNT(*) INTO total_pages
  FROM user_page_progress
  WHERE user_id = p_user_id 
    AND sanity_submodule_id = p_sanity_submodule_id;
  
  -- Get completed pages
  SELECT COUNT(*) INTO completed_pages
  FROM user_page_progress
  WHERE user_id = p_user_id 
    AND sanity_submodule_id = p_sanity_submodule_id
    AND is_completed = TRUE;
  
  -- Calculate percentage
  IF total_pages > 0 THEN
    progress_percent := (completed_pages::DECIMAL / total_pages::DECIMAL) * 100;
  ELSE
    progress_percent := 0;
  END IF;
  
  RETURN progress_percent;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate module progress percentage
CREATE OR REPLACE FUNCTION calculate_module_progress(
  p_user_id UUID,
  p_sanity_module_id TEXT
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_pages INTEGER;
  completed_pages INTEGER;
  progress_percent DECIMAL(5,2);
BEGIN
  -- Get total pages for this module
  SELECT COUNT(*) INTO total_pages
  FROM user_page_progress
  WHERE user_id = p_user_id 
    AND sanity_module_id = p_sanity_module_id;
  
  -- Get completed pages
  SELECT COUNT(*) INTO completed_pages
  FROM user_page_progress
  WHERE user_id = p_user_id 
    AND sanity_module_id = p_sanity_module_id
    AND is_completed = TRUE;
  
  -- Calculate percentage
  IF total_pages > 0 THEN
    progress_percent := (completed_pages::DECIMAL / total_pages::DECIMAL) * 100;
  ELSE
    progress_percent := 0;
  END IF;
  
  RETURN progress_percent;
END;
$$ LANGUAGE plpgsql;


