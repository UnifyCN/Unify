-- Normalize province values in user_onboarding_profiles to canonical full names.
--
-- Production held both "ON" and "Ontario", "BC" and "British Columbia". The
-- mobile client now normalizes on read and write (constants/LocationData.ts
-- normalizeProvince), but existing rows and any other writer of this shared
-- table (web app) still need the stored values fixed.
--
-- Apply through the Supabase dashboard or MCP. Do not `supabase db push`;
-- migrations for this project are applied out of band.

update public.user_onboarding_profiles
set province = canonical.name,
    updated_at = timezone('utc', now())
from (
  values
    ('ab', 'Alberta'),
    ('bc', 'British Columbia'),
    ('mb', 'Manitoba'),
    ('nb', 'New Brunswick'),
    ('nl', 'Newfoundland and Labrador'),
    ('nfld', 'Newfoundland and Labrador'),
    ('newfoundland', 'Newfoundland and Labrador'),
    ('nt', 'Northwest Territories'),
    ('nwt', 'Northwest Territories'),
    ('ns', 'Nova Scotia'),
    ('nu', 'Nunavut'),
    ('on', 'Ontario'),
    ('ont', 'Ontario'),
    ('pe', 'Prince Edward Island'),
    ('pei', 'Prince Edward Island'),
    ('qc', 'Quebec'),
    ('pq', 'Quebec'),
    ('québec', 'Quebec'),
    ('sk', 'Saskatchewan'),
    ('sask', 'Saskatchewan'),
    ('yt', 'Yukon'),
    ('yukon territory', 'Yukon'),
    -- canonical names stored with different casing or padding
    ('alberta', 'Alberta'),
    ('british columbia', 'British Columbia'),
    ('manitoba', 'Manitoba'),
    ('new brunswick', 'New Brunswick'),
    ('newfoundland and labrador', 'Newfoundland and Labrador'),
    ('northwest territories', 'Northwest Territories'),
    ('nova scotia', 'Nova Scotia'),
    ('nunavut', 'Nunavut'),
    ('ontario', 'Ontario'),
    ('prince edward island', 'Prince Edward Island'),
    ('quebec', 'Quebec'),
    ('saskatchewan', 'Saskatchewan'),
    ('yukon', 'Yukon')
) as canonical(alias, name)
where province is not null
  and lower(regexp_replace(btrim(province), '\s+', ' ', 'g')) = canonical.alias
  and province is distinct from canonical.name;
