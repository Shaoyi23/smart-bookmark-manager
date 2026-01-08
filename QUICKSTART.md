# 快速开始指南

## 1. 安装依赖

```bash
npm install
```

## 2. 配置Supabase

### 2.1 创建Supabase项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 创建新项目
3. 等待项目初始化完成

### 2.2 创建数据库表

1. 在Supabase控制台中，进入 **SQL Editor**
2. 打开项目根目录下的 `supabase-schema.sql` 文件
3. 复制所有SQL代码并粘贴到SQL编辑器中
4. 点击 **Run** 执行SQL脚本

### 2.3 获取API密钥

1. 在Supabase控制台中，进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL** (例如: `https://xxxxx.supabase.co`)
   - **anon/public key** (anon key)

### 2.4 配置环境变量

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入您的Supabase信息：
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. 创建扩展图标（可选）

在 `icons/` 目录下放置以下文件：
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

如果没有图标，扩展仍然可以运行，只是没有自定义图标。

## 4. 开发

```bash
npm run dev
```

这将启动开发服务器。注意：Chrome扩展需要在构建后加载，开发模式主要用于测试React组件。

## 5. 构建扩展

```bash
npm run build
```

构建完成后，`dist` 目录包含所有扩展文件。

## 6. 加载到Chrome

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目的 `dist` 目录

## 7. 使用扩展

1. 点击浏览器工具栏中的扩展图标
2. 首次使用会生成一个用户ID（自动保存）
3. 点击 **"同步书签"** 按钮，将Chrome书签同步到Supabase
4. 使用搜索框快速查找书签
5. 点击书签卡片上的链接图标打开网页
6. 点击删除图标删除书签

## 常见问题

### 同步失败？

- 检查 `.env` 文件中的Supabase配置是否正确
- 确认Supabase项目中的表已创建
- 检查浏览器控制台是否有错误信息

### 找不到模块错误？

运行 `npm install` 安装所有依赖。

### 构建失败？

确保所有依赖都已安装，并且TypeScript配置正确。

## 下一步

- 自定义UI样式
- 添加更多功能（分类管理、标签系统等）
- 配置Supabase Row Level Security策略以提高安全性
- 部署到Chrome Web Store（需要开发者账号）

