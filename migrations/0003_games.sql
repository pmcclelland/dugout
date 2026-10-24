-- One shared dugout per game code. Any coach with the code reads and writes it.
-- There is no user account. The roster lives in state and survives "new game".
create table if not exists games (
  code       text primary key,
  state      jsonb not null,
  revision   integer not null default 1,
  updated_at timestamptz not null default now()
);
