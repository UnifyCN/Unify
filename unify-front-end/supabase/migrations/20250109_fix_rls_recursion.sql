-- Fix RLS recursion for circle members
-- The previous policy created a recursive check because finding if you are a member required querying the members table
-- which itself required checking if you are a member.
-- Adding a direct "select self" policy breaks this recursion.

CREATE POLICY community_circle_members_select_self
    ON public.community_circle_members
    FOR SELECT
    USING (auth.uid() = user_id);
