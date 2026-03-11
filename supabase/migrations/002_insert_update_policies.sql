-- Insert/update policies added post-initial-migration

-- Profiles: users can insert their own profile
create policy "Users can insert own profile" on profiles for insert
  with check (auth.uid() = id);

-- Rounds: creators can insert and update
create policy "Users can create rounds" on rounds for insert
  with check (auth.uid() = created_by);
create policy "Round creator can update" on rounds for update
  using (auth.uid() = created_by);

-- Round players: round creator or self can insert
create policy "Players can join rounds" on round_players for insert
  with check (auth.uid() = profile_id);

-- Games: round creator can insert/update
create policy "Round creator can add games" on games for insert
  with check (round_id in (select id from rounds where created_by = auth.uid()));
create policy "Round creator can update games" on games for update
  using (round_id in (select id from rounds where created_by = auth.uid()));

-- Crews: anyone authenticated can create
create policy "Users can create crews" on crews for insert
  with check (auth.uid() = created_by);

-- Crew members: users can add themselves
create policy "Users can join crews" on crew_members for insert
  with check (auth.uid() = profile_id);

-- Game results: round creator can insert
create policy "Round creator can add results" on game_results for insert
  with check (game_id in (select id from games where round_id in (select id from rounds where created_by = auth.uid())));

-- Settlements: round creator can insert, payer/payee can update
create policy "Round creator can add settlements" on settlements for insert
  with check (round_id in (select id from rounds where created_by = auth.uid()));
create policy "Settlement parties can update" on settlements for update
  using (auth.uid() = payer_id or auth.uid() = payee_id);

-- Allow anyone to look up rounds by invite code (for joining)
create policy "Anyone can find rounds by invite code" on rounds for select
  using (true);
