-- Allow one non-@tsinglan.org admin email at signup, grant it admin role.
-- Idempotent: safe to re-run.

create or replace function public.enforce_tsinglan_domain()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or (lower(new.email) not like '%@tsinglan.org' and lower(new.email) <> 'firelight7831@gmail.com') then
    raise exception 'Sign up is restricted to @tsinglan.org email addresses';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_domain_check on auth.users;
create trigger on_auth_user_domain_check
  before insert on auth.users
  for each row execute function public.enforce_tsinglan_domain();

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email, 'member'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when lower(coalesce(new.email, '')) = 'firelight7831@gmail.com' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
