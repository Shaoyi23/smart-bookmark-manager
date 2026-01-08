# GitHub 推送指南

## 步骤 1：检查并更新 .gitignore

确保以下文件/目录不会被提交：
- `node_modules/` - 依赖包
- `dist/` - 构建输出
- `.env` - 环境变量（包含敏感信息）
- `dist.crx`, `dist.pem`, `dist.zip` - 打包文件

## 步骤 2：在 GitHub 上创建新仓库

1. 登录 GitHub
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `smart-bookmark-manager`
   - **Description**: `智能书签管理器 - Chrome扩展程序`
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为本地已有文件）
4. 点击 "Create repository"

## 步骤 3：在本地添加所有文件

```bash
# 添加所有文件到暂存区
git add .

# 检查要提交的文件（可选）
git status
```

## 步骤 4：创建初始提交

```bash
# 创建提交
git commit -m "Initial commit: 智能书签管理器 Chrome扩展"

# 或者使用更详细的提交信息
git commit -m "feat: 初始提交

- 添加 Chrome 扩展基础结构
- 集成 React + TypeScript + Vite
- 集成 shadcn/ui 组件库
- 实现书签同步功能
- 集成 Supabase 数据库
- 添加登录和设置功能
- 支持分类管理和搜索"
```

## 步骤 5：添加远程仓库并推送

```bash
# 添加远程仓库（将 YOUR_USERNAME 替换为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/smart-bookmark-manager.git

# 或者使用 SSH（如果您配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/smart-bookmark-manager.git

# 推送代码到 GitHub
git push -u origin master

# 如果您的默认分支是 main，使用：
# git push -u origin main
```

## 步骤 6：验证推送

1. 在浏览器中打开您的 GitHub 仓库页面
2. 确认所有文件都已上传
3. 检查 README.md 是否正确显示

## 常见问题

### 问题 1：分支名称不匹配

如果 GitHub 默认分支是 `main`，而本地是 `master`：

```bash
# 重命名本地分支
git branch -M main

# 然后推送
git push -u origin main
```

### 问题 2：需要先拉取远程代码

如果 GitHub 仓库已初始化（有 README），需要先合并：

```bash
# 拉取远程代码
git pull origin main --allow-unrelated-histories

# 解决可能的冲突后，再推送
git push -u origin main
```

### 问题 3：认证失败

如果推送时要求输入用户名密码：

1. **使用 Personal Access Token**（推荐）：
   - 在 GitHub Settings > Developer settings > Personal access tokens 创建 token
   - 使用 token 作为密码

2. **使用 SSH**（推荐）：
   ```bash
   # 生成 SSH key（如果还没有）
   ssh-keygen -t ed25519 -C "your_email@example.com"
   
   # 添加 SSH key 到 GitHub
   # 复制 ~/.ssh/id_ed25519.pub 的内容到 GitHub Settings > SSH and GPG keys
   
   # 使用 SSH URL
   git remote set-url origin git@github.com:YOUR_USERNAME/smart-bookmark-manager.git
   ```

## 后续操作

### 创建 .env.example 文件

确保 `.env.example` 文件已提交（不包含真实密钥）：

```bash
# 如果还没有 .env.example，创建一个
cat > .env.example << EOF
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

git add .env.example
git commit -m "docs: 添加环境变量示例文件"
git push
```

### 设置 GitHub Actions（可选）

可以添加 CI/CD 流程来自动构建和测试。

### 添加 License

考虑添加开源许可证（如 MIT License）。

## 快速命令总结

```bash
# 1. 添加文件
git add .

# 2. 提交
git commit -m "Initial commit: 智能书签管理器"

# 3. 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/smart-bookmark-manager.git

# 4. 推送
git push -u origin master
# 或
git push -u origin main
```

## 注意事项

⚠️ **重要**：确保 `.env` 文件不会被提交！
- `.env` 已在 `.gitignore` 中
- 只提交 `.env.example` 作为模板

✅ **推荐**：在推送前检查敏感信息
```bash
# 检查是否有敏感信息被提交
git log --all --full-history --source -- "*env*"
```
