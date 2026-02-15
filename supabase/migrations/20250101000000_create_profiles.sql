-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text default 'USER' check (role in ('USER', 'ADMIN')),
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default now(),

  constraint email_validation check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Set up Row Level Security (RLS)
alter table public.profiles
  enable row level security;

-- Profiles are viewable by the owner and admins
create policy "Profiles are viewable by owner and admins." on public.profiles
  for select using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Users can insert their own profile (usually via trigger, but good to have)
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

-- Users can update own profile (but we'll protect the role field via trigger)
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a profile entry when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to protect the role field
create or replace function public.handle_profile_update_protection()
returns trigger as $$
begin
  if (old.role <> new.role) and (not public.is_admin()) then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_updated_protection
  before update on public.profiles
  for each row execute procedure public.handle_profile_update_protection();
