-- Unique on (user_id, sanity_checklist_id) so we can upsert when user marks a checklist item complete.
-- Rows only exist for completed items; uncheck deletes the row.
-- (Multiple rows with sanity_checklist_id IS NULL are allowed per SQL unique semantics.)

alter table public.user_tasks
  add constraint user_tasks_user_sanity_checklist_id_key
  unique (user_id, sanity_checklist_id);
