-- Stotl — Learn from the Source
-- Additional schema for learn mode (classes, student codes, learn sessions)
-- Run this in your Supabase SQL editor after the base schema

-- Classes: teacher creates a class with philosopher + topic
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  philosopher_id text not null,
  topic_id text not null,
  teacher_password text not null,
  created_at timestamptz default now()
);

-- Student codes: unique alphanumeric code per student per class
create table if not exists student_codes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) not null,
  code text not null,
  student_name text,
  created_at timestamptz default now(),
  unique(class_id, code)
);

-- Learn sessions: student's learning + examination session
create table if not exists learn_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) not null,
  student_code text not null,
  topic_id text not null,
  phase text not null default 'learning',
  teaching_turns integer default 0,
  exam_turns integer default 0,
  self_assessment_score integer,
  assessment_letter text,
  verdict_badge text,
  philosopher_rating integer,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Learn messages: conversation messages for learn sessions
create table if not exists learn_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references learn_sessions(id) not null,
  role text not null,
  content text not null,
  phase text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_student_codes_class on student_codes(class_id);
create index if not exists idx_learn_sessions_class on learn_sessions(class_id);
create index if not exists idx_learn_sessions_student on learn_sessions(student_code);
create index if not exists idx_learn_messages_session on learn_messages(session_id);
