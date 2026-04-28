-- Cascade-delete reply comments when their parent comment is deleted.
-- Replaces the existing FK (ON DELETE SET NULL) with ON DELETE CASCADE
-- so orphaned replies don't surface as top-level comments after a parent
-- is removed.

ALTER TABLE post_comments
  DROP CONSTRAINT post_comments_parent_comment_id_fkey,
  ADD CONSTRAINT post_comments_parent_comment_id_fkey
    FOREIGN KEY (parent_comment_id)
    REFERENCES post_comments(id)
    ON DELETE CASCADE;
