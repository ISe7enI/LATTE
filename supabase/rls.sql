-- Enable Row Level Security for user-facing tables.
-- Note: current backend uses service_role and therefore bypasses RLS.
-- These policies prepare for future direct client access with Supabase Auth.

alter table workouts enable row level security;
alter table user_profiles enable row level security;
alter table user_preferences enable row level security;
alter table user_training_plans enable row level security;

drop policy if exists "workouts_select_own" on workouts;
create policy "workouts_select_own" on workouts
for select
using (auth.uid()::text = "userId");

drop policy if exists "workouts_mutate_own" on workouts;
create policy "workouts_mutate_own" on workouts
for all
using (auth.uid()::text = "userId")
with check (auth.uid()::text = "userId");

drop policy if exists "profiles_select_own" on user_profiles;
create policy "profiles_select_own" on user_profiles
for select
using (auth.uid()::text = id);

drop policy if exists "profiles_mutate_own" on user_profiles;
create policy "profiles_mutate_own" on user_profiles
for all
using (auth.uid()::text = id)
with check (auth.uid()::text = id);

drop policy if exists "preferences_select_own" on user_preferences;
create policy "preferences_select_own" on user_preferences
for select
using (auth.uid()::text = id);

drop policy if exists "preferences_mutate_own" on user_preferences;
create policy "preferences_mutate_own" on user_preferences
for all
using (auth.uid()::text = id)
with check (auth.uid()::text = id);

drop policy if exists "plans_select_own" on user_training_plans;
create policy "plans_select_own" on user_training_plans
for select
using (auth.uid()::text = "userId");

drop policy if exists "plans_mutate_own" on user_training_plans;
create policy "plans_mutate_own" on user_training_plans
for all
using (auth.uid()::text = "userId")
with check (auth.uid()::text = "userId");
