# host_permissions 说明和修复指南

## host_permissions 的作用

`host_permissions` 允许扩展访问指定网站的数据和资源。它用于：
- 通过 `fetch` 或 `XMLHttpRequest` 访问外部 API
- 在 content scripts 中访问页面数据
- 读取或修改网页内容

## 当前问题

您的 manifest.json 中设置了：
```json
"host_permissions": [
  "http://*/*",
  "https://*/*"
]
```

这会被 Chrome Web Store 审核拒绝，因为：
1. **权限过于宽泛**：请求访问所有网站的数据
2. **隐私风险**：用户会担心扩展访问所有网站
3. **审核要求**：必须明确说明为什么需要这些权限

## 实际需求分析

根据代码分析，您的扩展实际需要：

1. **Supabase API**：访问用户配置的 Supabase 项目
   - 域名格式：`*.supabase.co`
   - 但 Supabase JS SDK 通常不需要 host_permissions（使用 CORS）

2. **Google Favicon 服务**：获取网站图标
   - 域名：`www.google.com`
   - 这是只读请求，不需要特殊权限

3. **Content Scripts**：当前匹配所有 URL，但实际只用于获取页面信息
   - 如果不需要在所有页面运行，可以移除或缩小范围

## 修复方案

### 方案 1：移除 host_permissions（推荐）

如果 Supabase SDK 通过 CORS 工作，可能不需要 host_permissions：

```json
{
  "manifest_version": 3,
  "permissions": [
    "bookmarks",
    "storage",
    "tabs"
  ],
  // 移除 host_permissions
}
```

### 方案 2：使用可选权限

如果确实需要访问 Supabase，使用 `optional_host_permissions`：

```json
{
  "optional_host_permissions": [
    "https://*.supabase.co/*"
  ]
}
```

### 方案 3：缩小 content scripts 范围

如果不需要在所有页面运行 content script：

```json
{
  "content_scripts": [
    {
      "matches": [],  // 移除或设置为空
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

## 推荐配置

基于您的代码，推荐以下配置：

### ✅ 已修复的配置

我已经帮您修复了 manifest.json：

1. **移除了 `host_permissions`**
   - Supabase JS SDK 通过 CORS 工作，不需要 host_permissions
   - Google Favicon API 是公开的，不需要特殊权限

2. **移除了 `content_scripts`**
   - 当前代码中 content script 功能未实际使用
   - 如果将来需要，可以添加回来并缩小匹配范围

### 如果将来需要添加权限

如果将来需要访问特定网站，使用以下方式：

```json
{
  "optional_host_permissions": [
    "https://*.supabase.co/*"
  ]
}
```

`optional_host_permissions` 的优势：
- 用户可以选择是否授予权限
- 更容易通过 Chrome Web Store 审核
- 更符合隐私保护原则

## 审核说明

在提交审核时，如果被问到权限问题，可以说明：

1. **bookmarks**：用于读取和管理用户的 Chrome 书签
2. **storage**：用于存储用户设置和本地数据
3. **tabs**：用于在新标签页中打开书签链接

这些权限都是书签管理器功能所必需的，符合最小权限原则。
