-- 智能书签管理器数据库Schema
-- 在Supabase SQL编辑器中执行此脚本

-- 创建bookmarks表
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text not null,
  url text not null,
  description text,
  tags text[] default '{}',
  category text,
  favicon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_visited timestamp with time zone,
  visit_count integer default 0
);

-- 创建索引以提高查询性能
create index if not exists bookmarks_user_id_idx on bookmarks(user_id);
create index if not exists bookmarks_url_idx on bookmarks(url);
create index if not exists bookmarks_category_idx on bookmarks(category);
create index if not exists bookmarks_created_at_idx on bookmarks(created_at desc);

-- 启用Row Level Security (RLS)
alter table bookmarks enable row level security;

-- 创建策略：允许所有操作（开发阶段）
-- 生产环境建议使用更严格的策略
create policy "Allow all operations" on bookmarks
  for all 
  using (true) 
  with check (true);

-- 或者，如果您想使用Supabase Auth，可以使用以下策略：
-- create policy "Users can view own bookmarks" on bookmarks
--   for select using (auth.uid()::text = user_id);
-- 
-- create policy "Users can insert own bookmarks" on bookmarks
--   for insert with check (auth.uid()::text = user_id);
-- 
-- create policy "Users can update own bookmarks" on bookmarks
--   for update using (auth.uid()::text = user_id);
-- 
-- create policy "Users can delete own bookmarks" on bookmarks
--   for delete using (auth.uid()::text = user_id);

-- 创建更新时间触发器
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_bookmarks_updated_at
  before update on bookmarks
  for each row
  execute function update_updated_at_column();

