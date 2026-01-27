-- Standardize RLS policies to use the helper function
-- This ensures consistency and prevents recursion across all tables

-- 1. Update community_circles
DROP POLICY IF EXISTS community_circles_select_members ON public.community_circles;
CREATE POLICY community_circles_select_members
    ON public.community_circles
    FOR SELECT
    USING (
        id IN (SELECT circle_id FROM get_my_circle_ids())
    );

-- 2. Update community_messages
DROP POLICY IF EXISTS community_messages_select_members ON public.community_messages;
CREATE POLICY community_messages_select_members
    ON public.community_messages
    FOR SELECT
    USING (
        circle_id IN (SELECT circle_id FROM get_my_circle_ids())
    );
