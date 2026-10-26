-- Shared elderly care planner (run after schema.sql; once per project)
create table if not exists public.care_tasks (
 id uuid primary key default gen_random_uuid(),
 elder_id uuid not null references public.care_profiles(user_id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 1 and 100),
 details text not null default '' check(char_length(details)<=500),
 category text not null default 'other' check(category in ('medication','appointment','event','wellness','other')),
 due_date date not null,
 due_time time without time zone,
 recurrence text not null default 'none' check(recurrence in ('none','daily','weekly')),
 created_at timestamptz not null default now()
);
create index if not exists care_tasks_elder_due_idx on public.care_tasks(elder_id,due_date);
create table if not exists public.care_task_completions (
 task_id uuid not null references public.care_tasks(id) on delete cascade,
 scheduled_for date not null,
 completed_by uuid not null references auth.users(id),
 completed_at timestamptz not null default now(),
 primary key(task_id,scheduled_for)
);
create index if not exists care_task_completions_date_idx on public.care_task_completions(scheduled_for);
alter table public.care_tasks enable row level security;
alter table public.care_task_completions enable row level security;
revoke all on table public.care_tasks,public.care_task_completions from anon,authenticated;
grant select,insert,update,delete on public.care_tasks to authenticated;
grant select,insert,delete on public.care_task_completions to authenticated;
create policy "care tasks visible to senior and caregivers" on public.care_tasks for select to authenticated
using (elder_id=(select auth.uid()) or exists(select 1 from public.caregiver_links l where l.elder_id=care_tasks.elder_id and l.caregiver_id=(select auth.uid())));
create policy "senior or linked caregiver adds tasks" on public.care_tasks for insert to authenticated
with check(created_by=(select auth.uid()) and (elder_id=(select auth.uid()) or exists(select 1 from public.caregiver_links l where l.elder_id=care_tasks.elder_id and l.caregiver_id=(select auth.uid()))));
create policy "senior or creator edits tasks" on public.care_tasks for update to authenticated
using(elder_id=(select auth.uid()) or (created_by=(select auth.uid()) and exists(select 1 from public.caregiver_links l where l.elder_id=care_tasks.elder_id and l.caregiver_id=(select auth.uid()))))
with check(elder_id=(select auth.uid()) or (created_by=(select auth.uid()) and exists(select 1 from public.caregiver_links l where l.elder_id=care_tasks.elder_id and l.caregiver_id=(select auth.uid()))));
create policy "senior or creator removes tasks" on public.care_tasks for delete to authenticated
using(elder_id=(select auth.uid()) or (created_by=(select auth.uid()) and exists(select 1 from public.caregiver_links l where l.elder_id=care_tasks.elder_id and l.caregiver_id=(select auth.uid()))));
create policy "task completion visible to care circle" on public.care_task_completions for select to authenticated
using(exists(select 1 from public.care_tasks t where t.id=care_task_completions.task_id and (t.elder_id=(select auth.uid()) or exists(select 1 from public.caregiver_links l where l.elder_id=t.elder_id and l.caregiver_id=(select auth.uid())))));
create policy "only senior marks their tasks completed" on public.care_task_completions for insert to authenticated
with check(completed_by=(select auth.uid()) and exists(select 1 from public.care_tasks t where t.id=care_task_completions.task_id and t.elder_id=(select auth.uid()) and care_task_completions.scheduled_for>=t.due_date and (t.recurrence='daily' or (t.recurrence='none' and care_task_completions.scheduled_for=t.due_date) or (t.recurrence='weekly' and (care_task_completions.scheduled_for-t.due_date)%7=0))));
create policy "only senior can undo completion" on public.care_task_completions for delete to authenticated
using(exists(select 1 from public.care_tasks t where t.id=care_task_completions.task_id and t.elder_id=(select auth.uid())));
