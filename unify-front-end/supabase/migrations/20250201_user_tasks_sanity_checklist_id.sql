-- Add sanity_checklist_id to user_tasks for checklist content from Sanity
-- New checklist items are keyed by Sanity document _id; task_id (legacy) can remain for backward compat.

alter table public.user_tasks
  add column if not exists sanity_checklist_id text;

-- Allow task_id to be null for rows that use sanity_checklist_id
alter table public.user_tasks
  alter column task_id drop not null;

create index if not exists user_tasks_sanity_checklist_id_idx
  on public.user_tasks (sanity_checklist_id);

comment on column public.user_tasks.sanity_checklist_id is 'Sanity checklist document _id; used when checklist content is from Sanity';
