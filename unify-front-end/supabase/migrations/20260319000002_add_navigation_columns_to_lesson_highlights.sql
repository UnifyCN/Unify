-- Add navigation context so saved highlights can link back to the lesson page
ALTER TABLE lesson_highlights
  ADD COLUMN module_id TEXT,
  ADD COLUMN submodule_id TEXT,
  ADD COLUMN submodule_title TEXT,
  ADD COLUMN page_num INTEGER;

-- Indexes for SavedHighlightsList grouping/filtering
CREATE INDEX idx_lesson_highlights_submodule
  ON lesson_highlights(submodule_id)
  WHERE submodule_id IS NOT NULL;

CREATE INDEX idx_lesson_highlights_lesson_page
  ON lesson_highlights(lesson_id, page_num);
