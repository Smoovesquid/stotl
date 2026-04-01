-- Stotl — The Lyceum
-- Supabase schema with Row Level Security
-- Run this in your Supabase SQL editor after creating a project

-- Sessions table
create table sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  started_at timestamptz default now() not null,
  summary_json jsonb,
  turn_count int default 0 not null
);

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  role text check (role in ('user', 'aristotle')) not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index idx_sessions_user_id on sessions(user_id);
create index idx_sessions_started_at on sessions(started_at desc);
create index idx_messages_session_id on messages(session_id);
create index idx_messages_created_at on messages(created_at);

-- Row Level Security
alter table sessions enable row level security;
alter table messages enable row level security;

-- Users can only see/create their own sessions
create policy "Users can view own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update
  using (auth.uid() = user_id);

-- Users can only see/create messages in their own sessions
create policy "Users can view messages in own sessions"
  on messages for select
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "Users can create messages in own sessions"
  on messages for insert
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

-- Helper function for incrementing turn count
create or replace function increment_turn_count(sid uuid)
returns void as $$
begin
  update sessions set turn_count = turn_count + 1 where id = sid;
end;
$$ language plpgsql security definer;

-- Enable realtime (optional, for future live features)
alter publication supabase_realtime add table messages;
