-- Seed learn_modules with interests and personas mapped from onboarding quiz options.
-- interests values match LearningInterest type: documents, employment, finance, housing, pr_immigration, healthcare, family_kids, transit
-- personas values match Persona type: international_student, skilled_worker, refugee

UPDATE learn_modules SET interests = '{documents}', personas = '{}' WHERE sanity_id = '0777d5d9-02fe-4e7d-b644-2e25d1c4579a'; -- Documentation
UPDATE learn_modules SET interests = '{}', personas = '{international_student}' WHERE sanity_id = '1c0e599c-22a4-4b6f-ac12-3f4c01153eeb'; -- Simon Fraser University (SFU)
UPDATE learn_modules SET interests = '{healthcare}', personas = '{}' WHERE sanity_id = '1f43061d-0062-4ea5-bd82-6b25e8ee5a55'; -- Healthcare
UPDATE learn_modules SET interests = '{housing}', personas = '{}' WHERE sanity_id = '23aeb3ad-65e7-4e03-97b2-a3e14ffde080'; -- Housing
UPDATE learn_modules SET interests = '{finance}', personas = '{}' WHERE sanity_id = '4044e0bc-d26b-4a1e-9b7d-6a5e95c7f8ce'; -- Scam Prevention
UPDATE learn_modules SET interests = '{}', personas = '{international_student}' WHERE sanity_id = '40bfab0e-63a5-46e4-8911-24de6dd72ca2'; -- Education
UPDATE learn_modules SET interests = '{finance}', personas = '{}' WHERE sanity_id = '4c79ebb5-b03a-47aa-862e-6d0853eba7d4'; -- Finance
UPDATE learn_modules SET interests = '{}', personas = '{}' WHERE sanity_id = '80e8804e-c063-4264-ba4d-a02354718e57'; -- Canadian Culture
UPDATE learn_modules SET interests = '{}', personas = '{}' WHERE sanity_id = '968620ce-2843-4f5a-9c84-47fdf8c44ec9'; -- Test module to be deleted
UPDATE learn_modules SET interests = '{pr_immigration}', personas = '{skilled_worker,refugee}' WHERE sanity_id = '9717e260-bdeb-4ee4-8d39-4159a48eb627'; -- Permanent Resident (PR)
UPDATE learn_modules SET interests = '{employment}', personas = '{}' WHERE sanity_id = 'baeece22-8ac0-48a0-b310-baab55e38f88'; -- Employment
UPDATE learn_modules SET interests = '{finance}', personas = '{}' WHERE sanity_id = 'e0e9106e-c685-439a-8c67-2db46d7e7472'; -- Taxes & Government Benefits
UPDATE learn_modules SET interests = '{transit}', personas = '{}' WHERE sanity_id = 'fd8898a8-5802-4bd2-aa0b-097f89df5de0'; -- Transportation
