-- Create a function to handle new user trials automatically
create or replace function public.handle_new_user_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if user already has a subscription (unlikely for new user, but safe)
  if not exists (select 1 from public.subscriptions where user_id = new.id::text) then
    insert into public.subscriptions (
      id,
      user_id,
      status,
      quantity,
      cancel_at_period_end,
      trial_start,
      trial_end,
      current_period_start,
      current_period_end,
      metadata
    )
    values (
      'trial_' || new.id::text,
      new.id::text,
      'trialing',
      1,
      false,
      now(),
      now() + interval '7 days',
      now(),
      now() + interval '7 days',
      '{"source": "system_auto_trial"}'::jsonb
    );
  end if;
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created_trial on auth.users;
create trigger on_auth_user_created_trial
  after insert on auth.users
  for each row execute procedure public.handle_new_user_trial();
