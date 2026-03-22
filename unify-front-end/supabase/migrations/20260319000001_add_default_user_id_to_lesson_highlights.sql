-- Add default value for user_id so inserts auto-fill with the authenticated user
ALTER TABLE lesson_highlights ALTER COLUMN user_id SET DEFAULT auth.uid();
