-- Gimme: Golf Side Games & Settlement
-- Initial schema

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  handicap_index decimal(4,1),
  venmo_handle text,
  cashapp_handle text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Crews (persistent groups)
create table crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id),
  invite_code text not null unique default substring(gen_random_uuid()::text, 1, 8),
  created_at timestamptz not null default now()
);

alter table crews enable row level security;

create table crew_members (
  crew_id uuid not null references crews(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, profile_id)
);

alter table crew_members enable row level security;
create policy "Crew members can view their crew" on crews for select
  using (id in (select crew_id from crew_members where profile_id = auth.uid()));
create policy "Crew members can view members" on crew_members for select
  using (crew_id in (select crew_id from crew_members where profile_id = auth.uid()));

-- Courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  holes int not null default 18,
  par int[] not null,
  created_by uuid not null references profiles(id)
);

alter table courses enable row level security;
create policy "Courses are viewable by everyone" on courses for select using (true);
create policy "Users can create courses" on courses for insert with check (auth.uid() = created_by);

-- Rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  crew_id uuid references crews(id),
  created_by uuid not null references profiles(id),
  status text not null default 'setup' check (status in ('setup', 'active', 'complete')),
  invite_code text not null unique default substring(gen_random_uuid()::text, 1, 8),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table rounds enable row level security;

create table round_players (
  round_id uuid not null references rounds(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  tee_set text,
  handicap_at_time decimal(4,1),
  primary key (round_id, profile_id)
);

alter table round_players enable row level security;

-- Scores
create table scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  hole_number int not null check (hole_number between 1 and 18),
  strokes int not null check (strokes between 1 and 20),
  updated_at timestamptz not null default now(),
  unique (round_id, profile_id, hole_number)
);

alter table scores enable row level security;

-- Enable realtime on scores for live sync
alter publication supabase_realtime add table scores;

-- Games (side bets attached to rounds)
create table games (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  format text not null check (format in ('nassau', 'skins', 'wolf', 'bingo_bango_bongo')),
  config jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'complete'))
);

alter table games enable row level security;

-- Game results (per-player net amounts)
create table game_results (
  game_id uuid not null references games(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  net_amount decimal(10,2) not null default 0,
  details jsonb not null default '{}',
  primary key (game_id, profile_id)
);

alter table game_results enable row level security;

-- Settlements
create table settlements (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id),
  payer_id uuid not null references profiles(id),
  payee_id uuid not null references profiles(id),
  amount decimal(10,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'settled')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table settlements enable row level security;

-- RLS policies for round participants
create policy "Round players can view rounds" on rounds for select
  using (id in (select round_id from round_players where profile_id = auth.uid()) or created_by = auth.uid());
create policy "Round players can view players" on round_players for select
  using (round_id in (select round_id from round_players where profile_id = auth.uid()));
create policy "Round players can view scores" on scores for select
  using (round_id in (select round_id from round_players where profile_id = auth.uid()));
create policy "Round players can insert scores" on scores for insert
  with check (round_id in (select round_id from round_players where profile_id = auth.uid()) and profile_id = auth.uid());
create policy "Players can update own scores" on scores for update
  using (profile_id = auth.uid());
create policy "Round players can view games" on games for select
  using (round_id in (select round_id from round_players where profile_id = auth.uid()));
create policy "Round players can view results" on game_results for select
  using (game_id in (select id from games where round_id in (select round_id from round_players where profile_id = auth.uid())));
create policy "Round players can view settlements" on settlements for select
  using (payer_id = auth.uid() or payee_id = auth.uid());

-- Indexes
create index idx_scores_round on scores(round_id);
create index idx_scores_round_player on scores(round_id, profile_id);
create index idx_round_players_round on round_players(round_id);
create index idx_round_players_profile on round_players(profile_id);
create index idx_games_round on games(round_id);
create index idx_settlements_round on settlements(round_id);
create index idx_rounds_status on rounds(status);
