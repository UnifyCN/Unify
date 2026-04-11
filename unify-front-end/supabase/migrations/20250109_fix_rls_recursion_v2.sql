-- Function to get user's circles without RLS recursion
CREATE OR REPLACE FUNCTION get_my_circle_ids()
RETURNS TABLE (circle_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT circle_id
  FROM community_circle_members
  WHERE user_id = auth.uid()
  AND left_at IS NULL;
$$;

-- Drop the old recursive policy
DROP POLICY IF EXISTS community_circle_members_select_members ON public.community_circle_members;

-- Add new policy for seeing peers
-- Access granted if the target row's circle_id is in my list of circles
-- Note: 'community_circle_members_select_self' already handles seeing one's own row, 
-- but this covers it too (since circle_id is in the set). We can keep both or just this one. 
-- Keeping 'select_self' is harmless.
CREATE POLICY community_circle_members_select_peers
    ON public.community_circle_members
    FOR SELECT
    USING (
        circle_id IN (SELECT circle_id FROM get_my_circle_ids())
    );
