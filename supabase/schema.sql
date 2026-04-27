create table if not exists workouts (
  id text primary key,
  "studentId" text not null,
  "userId" text,
  title text not null,
  date text not null,
  duration text not null,
  volume text not null,
  "timeSpent" int,
  "totalVolume" int,
  "planTitle" text,
  exercises jsonb not null default '[]'::jsonb
);

create table if not exists workout_drafts (
  "userId" text primary key,
  exercises jsonb not null default '[]'::jsonb,
  "updatedAt" text not null
);

alter table workouts add column if not exists "studentId" text;
update workouts set "studentId" = 'U001' where "studentId" is null;
alter table workouts alter column "studentId" set not null;
alter table workouts add column if not exists "userId" text;
alter table workouts add column if not exists "timeSpent" int;
alter table workouts add column if not exists "totalVolume" int;
alter table workouts add column if not exists "planTitle" text;
update workouts set "userId" = "studentId" where "userId" is null;

create table if not exists coach_feedbacks (
  id text primary key,
  "coachId" text not null default 'C001',
  "studentId" text not null,
  "studentName" text not null,
  date text not null,
  "planName" text not null,
  metrics jsonb not null,
  note text not null,
  status text not null check (status in ('pending', 'replied')),
  "coachReply" text
);

create table if not exists coach_plans (
  id text primary key,
  "coachId" text not null default 'C001',
  date text not null,
  "studentId" text not null,
  exercises jsonb not null default '[]'::jsonb,
  status text not null check (status in ('planned', 'completed'))
);

create table if not exists coach_templates (
  id text primary key,
  "coachId" text not null default 'C001',
  name text not null,
  exercises jsonb not null default '[]'::jsonb
);

create table if not exists coach_students (
  id text primary key,
  "coachId" text not null default 'C001',
  name text not null,
  target text not null,
  "lastActive" text not null,
  completion int not null check (completion >= 0 and completion <= 100),
  trend text not null check (trend in ('up', 'down', 'flat'))
);

create table if not exists coach_workout_guidance (
  id text primary key,
  "coachId" text not null default 'C001',
  "workoutId" text not null,
  "studentId" text not null,
  note text not null,
  "createdAt" text not null,
  "updatedAt" text not null
);

create table if not exists user_profiles (
  id text primary key,
  nickname text not null,
  avatar text not null default '',
  gender text not null,
  height text not null,
  weight text not null,
  age text not null,
  goal text not null,
  level text not null
);

alter table user_profiles add column if not exists avatar text;
update user_profiles set avatar = '' where avatar is null;
alter table user_profiles alter column avatar set default '';
alter table user_profiles alter column avatar set not null;

create table if not exists user_preferences (
  id text primary key,
  "restTime" text not null,
  reminder boolean not null default true,
  theme text not null default 'dark',
  "intensityLowThreshold" int not null default 4000,
  "intensityHighThreshold" int not null default 10000
);

alter table user_preferences add column if not exists "intensityLowThreshold" int;
alter table user_preferences add column if not exists "intensityHighThreshold" int;
update user_preferences set "intensityLowThreshold" = 4000 where "intensityLowThreshold" is null;
update user_preferences set "intensityHighThreshold" = 10000 where "intensityHighThreshold" is null;
alter table user_preferences alter column "intensityLowThreshold" set default 4000;
alter table user_preferences alter column "intensityHighThreshold" set default 10000;
alter table user_preferences alter column "intensityLowThreshold" set not null;
alter table user_preferences alter column "intensityHighThreshold" set not null;

create table if not exists user_training_plans (
  id text primary key,
  "userId" text not null,
  title text not null,
  subtitle text not null,
  time text not null,
  sets text not null,
  level text not null,
  category text not null,
  "isSystem" boolean not null default false,
  exercises jsonb not null default '[]'::jsonb
);

create table if not exists auth_users (
  id text primary key,
  username text not null,
  phone text unique,
  "passwordHash" text not null,
  "createdAt" text not null
);

alter table auth_users drop constraint if exists auth_users_username_key;
alter table coach_feedbacks add column if not exists "coachId" text;
update coach_feedbacks set "coachId" = 'C001' where "coachId" is null;
alter table coach_feedbacks alter column "coachId" set default 'C001';
alter table coach_feedbacks alter column "coachId" set not null;

alter table coach_plans add column if not exists "coachId" text;
update coach_plans set "coachId" = 'C001' where "coachId" is null;
alter table coach_plans alter column "coachId" set default 'C001';
alter table coach_plans alter column "coachId" set not null;

alter table coach_templates add column if not exists "coachId" text;
update coach_templates set "coachId" = 'C001' where "coachId" is null;
alter table coach_templates alter column "coachId" set default 'C001';
alter table coach_templates alter column "coachId" set not null;

alter table coach_students add column if not exists "coachId" text;
update coach_students set "coachId" = 'C001' where "coachId" is null;
alter table coach_students alter column "coachId" set default 'C001';
alter table coach_students alter column "coachId" set not null;

alter table coach_workout_guidance add column if not exists "coachId" text;
update coach_workout_guidance set "coachId" = 'C001' where "coachId" is null;
alter table coach_workout_guidance alter column "coachId" set default 'C001';
alter table coach_workout_guidance alter column "coachId" set not null;

alter table auth_users add column if not exists phone text;
create unique index if not exists idx_auth_users_phone on auth_users (phone) where phone is not null;

create table if not exists auth_phone_codes (
  phone text primary key,
  code text not null,
  "expiresAt" text not null,
  "updatedAt" text not null
);

create index if not exists idx_workouts_userId_date on workouts ("userId", date desc);
create index if not exists idx_workouts_studentId_date on workouts ("studentId", date desc);
create index if not exists idx_user_training_plans_userId_system on user_training_plans ("userId", "isSystem");
create index if not exists idx_auth_users_username on auth_users (username);
create index if not exists idx_coach_guidance_student_updated on coach_workout_guidance ("studentId", "updatedAt" desc);
create index if not exists idx_coach_students_coach on coach_students ("coachId", id);
create index if not exists idx_coach_plans_coach_student_date on coach_plans ("coachId", "studentId", date);
create index if not exists idx_coach_templates_coach_name on coach_templates ("coachId", name);
create index if not exists idx_coach_feedbacks_coach_date on coach_feedbacks ("coachId", date desc);

insert into user_training_plans (id, "userId", title, subtitle, time, sets, level, category, "isSystem", exercises)
values
  (
    'sys-1',
    'SYSTEM',
    '胸部突破日',
    '(胸/前束/三头)',
    '45 MINS',
    '24 SETS',
    '胸',
    '部位专攻',
    true,
    '[{"id":"se-1","name":"杠铃卧推","muscle":"胸部","sets":[{"reps":10,"weight":60,"type":"N"}]}]'::jsonb
  ),
  (
    'sys-2',
    'SYSTEM',
    '背部厚度日',
    '(背/后束/二头)',
    '50 MINS',
    '28 SETS',
    '背',
    '部位专攻',
    true,
    '[{"id":"se-2","name":"杠铃划船","muscle":"背部","sets":[{"reps":10,"weight":60,"type":"N"}]}]'::jsonb
  ),
  (
    'sys-male-1',
    'SYSTEM',
    '增肌·男 初级推拉腿',
    '(胸背腿/每周3练)',
    '60 MINS',
    '30 SETS',
    '初级',
    '增肌·男',
    true,
    '[{"id":"m1-1","name":"杠铃卧推","muscle":"胸部","sets":[{"reps":8,"weight":50,"type":"N"}]},{"id":"m1-2","name":"引体向上","muscle":"背部","sets":[{"reps":8,"weight":0,"type":"N"}]},{"id":"m1-3","name":"杠铃深蹲","muscle":"腿部","sets":[{"reps":8,"weight":60,"type":"N"}]}]'::jsonb
  ),
  (
    'sys-male-2',
    'SYSTEM',
    '增肌·男 中级上/下肢',
    '(容量进阶/每周4练)',
    '70 MINS',
    '36 SETS',
    '中级',
    '增肌·男',
    true,
    '[{"id":"m2-1","name":"上斜卧推","muscle":"胸部","sets":[{"reps":10,"weight":45,"type":"N"}]},{"id":"m2-2","name":"哑铃划船","muscle":"背部","sets":[{"reps":10,"weight":26,"type":"N"}]},{"id":"m2-3","name":"传统硬拉","muscle":"背部","sets":[{"reps":5,"weight":90,"type":"N"}]}]'::jsonb
  ),
  (
    'sys-female-1',
    'SYSTEM',
    '增肌·女 臀腿优先',
    '(臀腿核心/每周3练)',
    '55 MINS',
    '28 SETS',
    '初级',
    '增肌·女',
    true,
    '[{"id":"f1-1","name":"杠铃深蹲","muscle":"腿部","sets":[{"reps":10,"weight":35,"type":"N"}]},{"id":"f1-2","name":"哑铃卧推","muscle":"胸部","sets":[{"reps":10,"weight":12,"type":"N"}]},{"id":"f1-3","name":"平板支撑","muscle":"核心","sets":[{"reps":45,"weight":0,"type":"N"}]}]'::jsonb
  ),
  (
    'sys-female-2',
    'SYSTEM',
    '增肌·女 全身塑形',
    '(上肢线条+下肢力量)',
    '60 MINS',
    '32 SETS',
    '中级',
    '增肌·女',
    true,
    '[{"id":"f2-1","name":"哑铃推举","muscle":"肩部","sets":[{"reps":10,"weight":10,"type":"N"}]},{"id":"f2-2","name":"绳索夹胸","muscle":"胸部","sets":[{"reps":12,"weight":15,"type":"N"}]},{"id":"f2-3","name":"杠铃弯举","muscle":"手臂","sets":[{"reps":12,"weight":15,"type":"N"}]}]'::jsonb
  )
on conflict (id) do update
set
  "userId" = excluded."userId",
  title = excluded.title,
  subtitle = excluded.subtitle,
  time = excluded.time,
  sets = excluded.sets,
  level = excluded.level,
  category = excluded.category,
  "isSystem" = excluded."isSystem",
  exercises = excluded.exercises;

