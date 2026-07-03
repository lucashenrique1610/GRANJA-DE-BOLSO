alter table public.user_subscriptions
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_consumed_at timestamptz,
  add column if not exists trial_origin text not null default 'app';

alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_trial_window_check;

alter table public.user_subscriptions
  add constraint user_subscriptions_trial_window_check
  check (
    (trial_started_at is null and trial_ends_at is null)
    or
    (
      trial_started_at is not null
      and trial_ends_at is not null
      and trial_ends_at > trial_started_at
    )
  );

create index if not exists idx_user_subscriptions_trial_ends_at
  on public.user_subscriptions (trial_ends_at)
  where trial_ends_at is not null;

insert into public.user_subscriptions (
  user_id,
  plan_code,
  plan_name,
  status,
  metadata
)
select
  users.id,
  'legacy_access',
  'Acesso legado',
  'legacy_active',
  jsonb_build_object('legacyAccess', true)
from auth.users as users
where not exists (
  select 1
  from public.user_subscriptions as subscriptions
  where subscriptions.user_id = users.id
);

create or replace function public.start_my_trial_15_days()
returns public.user_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_existing public.user_subscriptions;
  v_result public.user_subscriptions;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.'
      using errcode = '42501';
  end if;

  select *
  into v_existing
  from public.user_subscriptions
  where user_id = v_uid
  for update;

  if found then
    if v_existing.status = 'legacy_active'
      or v_existing.status = 'active'
      or v_existing.trial_consumed_at is not null then
      return v_existing;
    end if;

    update public.user_subscriptions
    set
      plan_code = 'trial_15_days',
      plan_name = 'Teste grátis 15 dias',
      status = 'trialing',
      trial_started_at = coalesce(v_existing.trial_started_at, v_now),
      trial_ends_at = coalesce(v_existing.trial_ends_at, v_now + interval '15 days'),
      trial_consumed_at = coalesce(v_existing.trial_consumed_at, v_now),
      trial_origin = coalesce(nullif(v_existing.trial_origin, ''), 'app'),
      updated_at = v_now
    where user_id = v_uid
    returning *
    into v_result;

    return v_result;
  end if;

  insert into public.user_subscriptions (
    user_id,
    plan_code,
    plan_name,
    status,
    trial_started_at,
    trial_ends_at,
    trial_consumed_at,
    trial_origin,
    metadata,
    updated_at
  )
  values (
    v_uid,
    'trial_15_days',
    'Teste grátis 15 dias',
    'trialing',
    v_now,
    v_now + interval '15 days',
    v_now,
    'app',
    jsonb_build_object('trialDays', 15),
    v_now
  )
  returning *
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.start_my_trial_15_days() from public;
grant execute on function public.start_my_trial_15_days() to authenticated;
