-- Case-insensitive uniqueness for team/game codes.
-- Existing rows keep their stored codes; 'Tigers' and 'tigers' cannot both exist.
create unique index if not exists games_code_normalized_uidx
  on games (lower(btrim(code)));
