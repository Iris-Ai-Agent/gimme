-- Restrict profile visibility to related users only
-- Drop the overly permissive public read policy
drop policy if exists "Public profiles are viewable by everyone" on profiles;

-- Allow viewing profiles if:
-- 1. It's your own profile
-- 2. The person is in the same round as you
-- 3. The person is in the same crew as you
create policy "Users can view related profiles" on profiles for select
  using (
    auth.uid() = id
    or id in (
      select rp2.profile_id from round_players rp1
      join round_players rp2 on rp1.round_id = rp2.round_id
      where rp1.profile_id = auth.uid()
    )
    or id in (
      select cm2.profile_id from crew_members cm1
      join crew_members cm2 on cm1.crew_id = cm2.crew_id
      where cm1.profile_id = auth.uid()
    )
  );
