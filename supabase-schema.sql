-- 智能书签管理器数据库初始化脚本
-- 适用于全新的 Supabase 项目，直接在 SQL Editor 中执行
-- 这个版本与当前前端代码保持一致，并补上了去重约束和更新时间触发器

create extension if not exists pgcrypto;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  url text not null,
  description text default '',
  tags text[] not null default '{}',
  category text default '未分类',
  favicon text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_visited timestamptz,
  visit_count integer not null default 0,
  constraint bookmarks_title_not_blank check (char_length(trim(title)) > 0),
  constraint bookmarks_url_not_blank check (char_length(trim(url)) > 0),
  constraint bookmarks_visit_count_non_negative check (visit_count >= 0)
);

comment on table public.bookmarks is 'Chrome 扩展同步后的书签数据';
comment on column public.bookmarks.user_id is '匿名模式下使用本地生成的 user_xxx；登录后使用 Supabase Auth 的 user.id';

create unique index if not exists bookmarks_user_id_url_key
  on public.bookmarks (user_id, url);

create index if not exists bookmarks_user_id_idx
  on public.bookmarks (user_id);

create index if not exists bookmarks_category_idx
  on public.bookmarks (category);

create index if not exists bookmarks_created_at_idx
  on public.bookmarks (created_at desc);

create index if not exists bookmarks_title_search_idx
  on public.bookmarks using gin (to_tsvector('simple', coalesce(title, '')));

create index if not exists bookmarks_description_search_idx
  on public.bookmarks using gin (to_tsvector('simple', coalesce(description, '')));

alter table public.bookmarks enable row level security;

drop policy if exists "Allow all operations" on public.bookmarks;
drop policy if exists "bookmarks_public_dev_access" on public.bookmarks;
drop policy if exists "bookmarks_authenticated_read_own" on public.bookmarks;
drop policy if exists "bookmarks_authenticated_insert_own" on public.bookmarks;
drop policy if exists "bookmarks_authenticated_update_own" on public.bookmarks;
drop policy if exists "bookmarks_authenticated_delete_own" on public.bookmarks;

-- 当前扩展在匿名模式下使用本地生成的 user_id 直连数据库。
-- 因为你提到数据不重要，这里保留开发友好的开放策略，保证匿名同步可以直接使用。
create policy "bookmarks_public_dev_access"
  on public.bookmarks
  for all
  using (true)
  with check (true);

-- 如果后续你决定彻底切到登录态，再改用下面这组策略，并删除上面的开放策略：
-- create policy "bookmarks_authenticated_read_own"
--   on public.bookmarks
--   for select
--   using (auth.uid()::text = user_id);
--
-- create policy "bookmarks_authenticated_insert_own"
--   on public.bookmarks
--   for insert
--   with check (auth.uid()::text = user_id);
--
-- create policy "bookmarks_authenticated_update_own"
--   on public.bookmarks
--   for update
--   using (auth.uid()::text = user_id)
--   with check (auth.uid()::text = user_id);
--
-- create policy "bookmarks_authenticated_delete_own"
--   on public.bookmarks
--   for delete
--   using (auth.uid()::text = user_id);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists update_bookmarks_updated_at on public.bookmarks;

create trigger update_bookmarks_updated_at
before update on public.bookmarks
for each row
execute function public.update_updated_at_column();

-- 可选：如果你以后要启用真正的语义搜索，可继续执行 `SEMANTIC_SEARCH_SETUP.md`
-- 其中会为 bookmarks 增加 embedding 列和 RPC 检索函数
