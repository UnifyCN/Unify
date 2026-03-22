-- Create lesson_highlights table for storing user text highlights in lessons
CREATE TABLE IF NOT EXISTS lesson_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  page_key TEXT NOT NULL,
  block_key TEXT NOT NULL,
  start_word_index INTEGER NOT NULL,
  end_word_index INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_non_negative_indices CHECK (start_word_index >= 0 AND end_word_index >= 0),
  CONSTRAINT chk_valid_range CHECK (start_word_index <= end_word_index)
);

-- Composite index for the primary query: fetch all highlights for a user on a specific lesson page
CREATE INDEX idx_lesson_highlights_lookup
  ON lesson_highlights(user_id, lesson_id, page_key);

-- Enable Row Level Security
ALTER TABLE lesson_highlights ENABLE ROW LEVEL SECURITY;

-- Users can only read their own highlights
CREATE POLICY "Users can read own highlights"
  ON lesson_highlights FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create highlights for themselves
CREATE POLICY "Users can create own highlights"
  ON lesson_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own highlights
CREATE POLICY "Users can delete own highlights"
  ON lesson_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own highlights (for merge operations)
CREATE POLICY "Users can update own highlights"
  ON lesson_highlights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
