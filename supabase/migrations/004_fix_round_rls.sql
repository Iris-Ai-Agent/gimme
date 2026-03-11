-- Fix overly permissive RLS on rounds table and add RPC functions
-- for invite-code lookups and cross-player score posting.

-- 1. Drop the using(true) policy that exposes ALL rounds to anyone
drop policy if exists "Anyone can find rounds by invite code" on rounds;

-- 2. RPC: join a round by invite code (no SELECT on rounds needed)
create or replace function join_round_by_invite_code(code text)
returns uuid as $$
declare round_id uuid;
begin
  select id into round_id from rounds where invite_code = code and status in ('pending', 'active');
  if round_id is null then
    raise exception 'Round not found or already completed';
  end if;
  insert into round_players (round_id, profile_id) values (round_id, auth.uid())
  on conflict (round_id, profile_id) do nothing;
  return round_id;
end;
$$ language plpgsql security definer;

-- 3. RPC: join a crew by invite code (no SELECT on crews needed for non-members)
create or replace function join_crew_by_invite_code(code text)
returns uuid as $$
declare found_crew_id uuid;
begin
  select id into found_crew_id from crews where invite_code = lower(code);
  if found_crew_id is null then
    raise exception 'Crew not found';
  end if;
  insert into crew_members (crew_id, profile_id) values (found_crew_id, auth.uid())
  on conflict (crew_id, profile_id) do nothing;
  return found_crew_id;
end;
$$ language plpgsql security definer;

-- 4. RPC: post a score on behalf of any participant (caller must also be a participant)
create or replace function post_score(p_round_id uuid, p_profile_id uuid, p_hole_number int, p_strokes int)
returns void as $$
begin
  -- Verify caller is a participant in this round
  if not exists (select 1 from round_players where round_id = p_round_id and profile_id = auth.uid()) then
    raise exception 'Not a participant in this round';
  end if;
  -- Verify target player is also a participant
  if not exists (select 1 from round_players where round_id = p_round_id and profile_id = p_profile_id) then
    raise exception 'Target player is not in this round';
  end if;
  -- Upsert the score
  insert into scores (round_id, profile_id, hole_number, strokes)
  values (p_round_id, p_profile_id, p_hole_number, p_strokes)
  on conflict (round_id, profile_id, hole_number)
  do update set strokes = excluded.strokes, updated_at = now();
end;
$$ language plpgsql security definer;
