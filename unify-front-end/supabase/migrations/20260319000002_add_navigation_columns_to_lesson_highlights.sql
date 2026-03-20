-- Add navigation context so saved highlights can link back to the lesson page
ALTER TABLE lesson_highlights
  ADD COLUMN module_id TEXT,
  ADD COLUMN submodule_id TEXT,
  ADD COLUMN submodule_title TEXT,
  ADD COLUMN page_num INTEGER;
