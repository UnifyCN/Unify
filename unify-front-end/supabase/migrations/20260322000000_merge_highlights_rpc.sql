-- Atomic merge_highlights RPC: deletes overlapping highlights and inserts the merged one
-- in a single transaction to prevent data loss if insert fails after delete.
CREATE OR REPLACE FUNCTION merge_highlights(
  p_ids_to_delete UUID[],
  p_lesson_id TEXT,
  p_page_key TEXT,
  p_block_key TEXT,
  p_start_word_index INTEGER,
  p_end_word_index INTEGER,
  p_selected_text TEXT,
  p_module_id TEXT DEFAULT NULL,
  p_submodule_id TEXT DEFAULT NULL,
  p_submodule_title TEXT DEFAULT NULL,
  p_page_num INTEGER DEFAULT NULL
)
RETURNS lesson_highlights
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result lesson_highlights;
  current_uid UUID := auth.uid();
BEGIN
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete overlapping highlights scoped to this user + lesson/page/block context
  DELETE FROM lesson_highlights
  WHERE id = ANY(p_ids_to_delete)
    AND user_id = current_uid
    AND lesson_id = p_lesson_id
    AND page_key = p_page_key
    AND block_key = p_block_key;

  -- Insert the merged highlight
  INSERT INTO lesson_highlights (
    user_id, lesson_id, page_key, block_key,
    start_word_index, end_word_index, selected_text,
    module_id, submodule_id, submodule_title, page_num
  ) VALUES (
    current_uid, p_lesson_id, p_page_key, p_block_key,
    p_start_word_index, p_end_word_index, p_selected_text,
    p_module_id, p_submodule_id, p_submodule_title, p_page_num
  )
  RETURNING * INTO result;

  RETURN result;
END;
$$;
