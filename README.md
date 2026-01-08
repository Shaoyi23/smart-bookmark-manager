# 智能书签管理器

一款基于Chrome扩展的智能书签管理工具，帮助您整理和发现收藏的网页。

## 功能特性

- 📚 **自动同步**：一键同步Chrome浏览器中的所有书签
- 🔍 **智能搜索**：快速搜索书签标题、URL和描述
- 🏷️ **分类标签**：支持分类和标签管理
- 💾 **云端存储**：使用Supabase存储书签数据
- 🎨 **现代UI**：基于shadcn/ui的美观界面

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **UI组件库**：shadcn/ui + Tailwind CSS
- **数据库**：Supabase
- **部署**：Vercel

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置Supabase

1. 在Supabase创建新项目
2. 在SQL编辑器中执行以下SQL创建表结构：

```sql
-- 创建bookmarks表
create table bookmarks (
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

-- 创建索引
create index bookmarks_user_id_idx on bookmarks(user_id);
create index bookmarks_url_idx on bookmarks(url);
create index bookmarks_category_idx on bookmarks(category);

-- 启用Row Level Security (可选，用于多用户)
alter table bookmarks enable row level security;

-- 创建策略（允许所有操作，您可以根据需要调整）
create policy "Allow all operations" on bookmarks
  for all using (true) with check (true);
```

3. 复制 `.env.example` 为 `.env` 并填入您的Supabase配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 开发

```bash
npm run dev
```

### 4. 构建

```bash
npm run build
```

构建完成后，`dist` 目录包含扩展的所有文件。

### 5. 加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 项目结构

```
smart-bookmark-manager/
├── src/
│   ├── popup/           # 扩展弹窗主界面
│   │   ├── App.tsx      # 主应用组件
│   │   ├── main.tsx     # 入口文件
│   │   └── index.css    # 样式文件
│   ├── background/      # 后台脚本
│   │   └── index.ts
│   ├── content/         # 内容脚本
│   │   └── index.ts
│   ├── components/      # React组件
│   │   └── ui/         # shadcn/ui组件
│   └── lib/            # 工具函数
│       ├── supabase.ts # Supabase配置和API
│       └── chrome-bookmarks.ts # Chrome书签API封装
├── manifest.json        # Chrome扩展清单
├── package.json
└── vite.config.ts      # Vite配置
```

## 部署到Vercel

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 部署

注意：Chrome扩展需要本地安装，Vercel部署主要用于展示或作为Web版本。

## 功能开发路线图

- [ ] 书签分类管理
- [ ] 标签系统
- [ ] 书签描述自动提取
- [ ] 访问统计
- [ ] 书签导入/导出
- [ ] 暗色模式
- [ ] 多语言支持

## 许可证

MIT

