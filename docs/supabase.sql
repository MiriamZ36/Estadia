-- Supabase SQL schema for Torneo Fut / LigaSmart
-- Schema: public | IDs: UUID | Auth: Supabase Auth + profiles

create extension if not exists "pgcrypto";

-- Profiles linked to Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'fan' check (role in ('admin','referee','coach','fan')),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coaches
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  license text,
  experience int not null check (experience >= 0),
  email text not null,
  phone text,
  specialty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Referees
create table if not exists public.referees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  license text not null,
  experience int not null check (experience >= 0),
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tournaments
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null check (format in ('5','7','11')),
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('upcoming','active','completed')),
  organizer_id uuid references public.profiles(id) on delete set null,
  rules text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  logo_url text,
  founded_date date,
  coach_id uuid references public.coaches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, name)
);

-- Players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  position text not null,
  number int not null check (number > 0),
  photo_url text,
  birth_date date,
  nationality text,
  height_cm int check (height_cm > 0),
  weight_kg int check (weight_kg > 0),
  dominant_foot text check (dominant_foot in ('left','right','both')),
  email text,
  phone text,
  emergency_contact text,
  blood_type text,
  medical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, number)
);

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  match_date date not null,
  match_time time not null,
  venue text not null,
  status text not null check (status in ('scheduled','live','finished')),
  home_score int,
  away_score int,
  referee_id uuid references public.referees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

-- Match events
create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  type text not null check (type in ('goal','yellow_card','red_card','substitution')),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  minute int not null check (minute >= 0 and minute <= 130),
  description text,
  created_at timestamptz not null default now()
);

-- Standings (optional, can be derived)
create table if not exists public.standings (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  goal_difference int not null default 0,
  points int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

-- Indexes
create index if not exists idx_teams_tournament_id on public.teams (tournament_id);
create index if not exists idx_players_team_id on public.players (team_id);
create index if not exists idx_matches_tournament_id on public.matches (tournament_id);
create index if not exists idx_matches_home_team_id on public.matches (home_team_id);
create index if not exists idx_matches_away_team_id on public.matches (away_team_id);
create index if not exists idx_match_events_match_id on public.match_events (match_id);
create index if not exists idx_match_events_player_id on public.match_events (player_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_coaches_updated_at before update on public.coaches for each row execute function public.set_updated_at();
create trigger set_referees_updated_at before update on public.referees for each row execute function public.set_updated_at();
create trigger set_tournaments_updated_at before update on public.tournaments for each row execute function public.set_updated_at();
create trigger set_teams_updated_at before update on public.teams for each row execute function public.set_updated_at();
create trigger set_players_updated_at before update on public.players for each row execute function public.set_updated_at();
create trigger set_matches_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger set_standings_updated_at before update on public.standings for each row execute function public.set_updated_at();
