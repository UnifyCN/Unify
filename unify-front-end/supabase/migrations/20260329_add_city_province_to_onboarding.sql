-- Add city and province columns to onboarding_profiles table
ALTER TABLE public.user_onboarding_profiles
ADD COLUMN city TEXT NULL,
ADD COLUMN province TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_onboarding_profiles.city IS 'City selected by user during onboarding (or "other" for custom)';
COMMENT ON COLUMN public.user_onboarding_profiles.province IS 'Province/territory selected by user or auto-filled from city';
