-- Pratamalab database schema for Supabase/PostgreSQL.
-- Apply with `supabase db reset` locally or paste once into the Supabase SQL editor.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Tables are intentionally created before policies so a fresh database can migrate cleanly.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  avatar_color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace' check (char_length(name) between 1 and 120),
  icon text not null default '🏠' check (char_length(icon) <= 16),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid references public.pages(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 500),
  icon text not null default '📄' check (char_length(icon) <= 16),
  cover_url text,
  is_public boolean not null default false,
  is_deleted boolean not null default false,
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null default 'text' check (
    type in ('text','h1','h2','h3','todo','bullet','numbered','quote','callout',
             'code','formula','table','divider','image','embed','toggle')
  ),
  html text not null default '' check (octet_length(html) <= 1000000),
  sort_order double precision not null default 0,
  checked boolean,
  icon text,
  lang text,
  rows jsonb,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_shares (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  share_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  can_edit boolean not null default false,
  password_hash text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  block_id uuid references public.blocks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null check (char_length(content) between 1 and 10000),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index pages_workspace_idx on public.pages(workspace_id, sort_order) where not is_deleted;
create index pages_parent_idx on public.pages(parent_id) where not is_deleted;
create index pages_title_trgm on public.pages using gin(title gin_trgm_ops);
create index blocks_page_idx on public.blocks(page_id, sort_order);
create index comments_page_idx on public.comments(page_id, created_at);

-- Security-definer predicates prevent recursive workspace_members RLS evaluation.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid() and role = any(allowed_roles)
  );
$$;

create or replace function public.shares_workspace_with(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.workspace_members mine
    join public.workspace_members theirs using (workspace_id)
    where mine.user_id = auth.uid() and theirs.user_id = target_user_id
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, text[]) from public;
revoke all on function public.shares_workspace_with(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to anon, authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to anon, authenticated;
grant execute on function public.shares_workspace_with(uuid) to authenticated;

-- Account/workspace bootstrap runs server-side and cannot be forged by the browser.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    '#' || lpad(to_hex(floor(random() * 16777215)::int), 6, '0')
  );
  return new;
end;
$$;

create or replace function public.add_workspace_owner()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
create trigger on_workspace_created after insert on public.workspaces
  for each row execute function public.add_workspace_owner();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();
create trigger blocks_updated_at before update on public.blocks
  for each row execute function public.set_updated_at();
create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.page_shares enable row level security;
alter table public.comments enable row level security;

create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.shares_workspace_with(id)
);
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy workspaces_select on public.workspaces for select using (
  owner_id = auth.uid() or public.is_workspace_member(id)
);
create policy workspaces_insert on public.workspaces for insert with check (owner_id = auth.uid());
create policy workspaces_update on public.workspaces for update
  using (owner_id = auth.uid() or public.has_workspace_role(id, array['owner','admin']))
  with check (owner_id = auth.uid() or public.has_workspace_role(id, array['owner','admin']));

create policy members_select on public.workspace_members for select using (
  user_id = auth.uid() or public.is_workspace_member(workspace_id)
);
create policy members_insert on public.workspace_members for insert with check (
  public.has_workspace_role(workspace_id, array['owner','admin']) and role <> 'owner'
);
create policy members_update on public.workspace_members for update
  using (public.has_workspace_role(workspace_id, array['owner','admin']) and role <> 'owner')
  with check (public.has_workspace_role(workspace_id, array['owner','admin']) and role <> 'owner');
create policy members_delete on public.workspace_members for delete using (
  public.has_workspace_role(workspace_id, array['owner','admin']) and role <> 'owner'
);

create policy pages_select on public.pages for select using (
  is_public or public.is_workspace_member(workspace_id)
);
create policy pages_insert on public.pages for insert with check (
  created_by = auth.uid() and public.has_workspace_role(workspace_id, array['owner','admin','member'])
);
create policy pages_update on public.pages for update
  using (public.has_workspace_role(workspace_id, array['owner','admin','member']))
  with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));
create policy pages_delete on public.pages for delete using (
  created_by = auth.uid() or public.has_workspace_role(workspace_id, array['owner','admin'])
);

create policy blocks_select on public.blocks for select using (exists (
  select 1 from public.pages p where p.id = page_id and not p.is_deleted
    and (p.is_public or public.is_workspace_member(p.workspace_id))
));
create policy blocks_insert on public.blocks for insert with check (exists (
  select 1 from public.pages p where p.id = page_id and not p.is_deleted
    and public.has_workspace_role(p.workspace_id, array['owner','admin','member'])
));
create policy blocks_update on public.blocks for update
  using (exists (
    select 1 from public.pages p where p.id = page_id and not p.is_deleted
      and public.has_workspace_role(p.workspace_id, array['owner','admin','member'])
  ))
  with check (exists (
    select 1 from public.pages p where p.id = page_id and not p.is_deleted
      and public.has_workspace_role(p.workspace_id, array['owner','admin','member'])
  ));
create policy blocks_delete on public.blocks for delete using (exists (
  select 1 from public.pages p where p.id = page_id and not p.is_deleted
    and public.has_workspace_role(p.workspace_id, array['owner','admin','member'])
));

create policy shares_manage on public.page_shares for all
  using (exists (
    select 1 from public.pages p where p.id = page_id
      and public.has_workspace_role(p.workspace_id, array['owner','admin'])
  ))
  with check (exists (
    select 1 from public.pages p where p.id = page_id
      and public.has_workspace_role(p.workspace_id, array['owner','admin'])
  ));

create policy comments_select on public.comments for select using (exists (
  select 1 from public.pages p where p.id = page_id
    and (p.is_public or public.is_workspace_member(p.workspace_id))
));
create policy comments_insert on public.comments for insert with check (
  author_id = auth.uid() and exists (
    select 1 from public.pages p where p.id = page_id
      and public.has_workspace_role(p.workspace_id, array['owner','admin','member'])
  )
);
create policy comments_update on public.comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete using (
  author_id = auth.uid() or exists (
    select 1 from public.pages p where p.id = page_id
      and public.has_workspace_role(p.workspace_id, array['owner','admin'])
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.pages, public.blocks, public.comments to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Safe when realtime already contains one of these tables.
do $$
declare target_table text;
begin
  foreach target_table in array array['pages', 'blocks', 'comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end;
$$;
