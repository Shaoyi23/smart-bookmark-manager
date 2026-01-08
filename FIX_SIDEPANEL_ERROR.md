# 修复 sidePanel API 错误

## 问题描述

错误信息：`TypeError: Cannot read properties of undefined (reading 'open')`

这个错误发生在尝试使用 `chrome.sidePanel.open()` 时，因为：
1. Chrome版本可能不支持 `sidePanel` API（需要Chrome 114+）
2. API可能未正确初始化
3. 缺少错误处理

## 修复方案

### 1. 添加API可用性检查

在 `src/background/index.ts` 中添加了以下改进：

- ✅ 检查 `chrome.sidePanel` 是否存在
- ✅ 检查 `chrome.sidePanel.open` 是否为函数
- ✅ 添加 try-catch 错误处理
- ✅ 添加 Promise 的 `.catch()` 处理

### 2. 提供降级方案

在 `manifest.json` 中同时设置了：
- `side_panel.default_path` - 支持侧边栏的Chrome版本
- `action.default_popup` - 不支持侧边栏时的降级方案

### 3. 代码改进

```typescript
// 检查API是否可用
if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
  try {
    chrome.sidePanel.open({ windowId: tab.windowId })
      .catch((error) => {
        console.error('打开侧边栏失败，使用弹窗模式:', error)
      })
  } catch (error) {
    console.error('打开侧边栏异常，使用弹窗模式:', error)
  }
}
```

## 使用说明

### 支持的Chrome版本

- **Chrome 114+**: 支持侧边栏（Side Panel）
- **Chrome < 114**: 自动使用弹窗（Popup）模式

### 行为说明

1. **如果sidePanel可用**：
   - 点击扩展图标会尝试打开侧边栏
   - 如果失败，会回退到弹窗模式

2. **如果sidePanel不可用**：
   - 直接使用弹窗模式（`default_popup`）

## 测试步骤

1. 重新构建扩展：
   ```bash
   npm run build
   ```

2. 在Chrome中重新加载扩展：
   - 打开 `chrome://extensions/`
   - 点击扩展的"重新加载"按钮

3. 测试功能：
   - 点击扩展图标
   - 检查是否正常打开（侧边栏或弹窗）
   - 查看控制台是否有错误信息

## 注意事项

- 如果同时设置了 `default_popup` 和 `onClicked`，`onClicked` 不会触发
- 当前实现：优先使用侧边栏，如果不可用则使用弹窗
- 所有错误都会被捕获并记录到控制台，不会导致扩展崩溃

## 相关文件

- `src/background/index.ts` - 后台脚本
- `manifest.json` - 扩展配置

