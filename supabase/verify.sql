-- Check CareBridge tables and RLS configuration after applying schema and planner migration.
select t.tablename,
 c.relrowsecurity as rls_enabled,
 (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=t.tablename) as policy_count
from pg_tables t join pg_class c on c.oid=('public.'||quote_ident(t.tablename))::regclass
where t.schemaname='public'
and t.tablename in ('care_profiles','caregiver_links','check_ins','daily_notes','reminders','followups','pairing_codes','care_tasks','care_task_completions')
order by t.tablename;
