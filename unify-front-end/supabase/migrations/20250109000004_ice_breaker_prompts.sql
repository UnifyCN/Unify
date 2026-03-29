-- Add last_ice_breaker_day column to track which ice breaker prompts have been sent
-- This prevents duplicate prompts from being sent to the same circle

ALTER TABLE public.community_circles 
ADD COLUMN IF NOT EXISTS last_ice_breaker_day INT DEFAULT 0;

-- Add a comment for documentation
COMMENT ON COLUMN public.community_circles.last_ice_breaker_day IS 
    'Tracks which day ice breaker prompt was last sent (1, 3, 7, 10, 12). 0 means none sent yet.';
