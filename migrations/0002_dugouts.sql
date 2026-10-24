-- One saved dugout per signed-in coach: team name, roster, defensive
-- innings, and the batting order. user_id is Better Auth's text id.
create table if not exists dugouts (
  user_id    text primary key,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);
