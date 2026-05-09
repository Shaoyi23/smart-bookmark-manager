// Chrome扩展后台脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('智能书签管理器已安装')
  // 设置侧边栏（如果API可用）
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    try {
      chrome.sidePanel.setOptions({ path: 'index.html' })
        .catch((error) => {
          console.warn('侧边栏设置失败:', error)
        })
    } catch (error) {
      console.warn('侧边栏设置失败:', error)
    }
  }
})

// 点击扩展图标时的处理
// 注意：如果manifest.json中设置了default_popup，onClicked不会触发
// 这里提供一个备选方案：如果sidePanel可用，尝试打开侧边栏
// 否则会使用default_popup（在manifest.json中已设置）
chrome.action.onClicked.addListener((tab) => {
  // 检查sidePanel API是否可用
  if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
    try {
      chrome.sidePanel.open({ windowId: tab.windowId })
        .catch((error) => {
          console.error('打开侧边栏失败，使用弹窗模式:', error)
        })
    } catch (error) {
      console.error('打开侧边栏异常，使用弹窗模式:', error)
    }
  } else {
    console.log('sidePanel API不可用，将使用弹窗模式（default_popup）')
  }
})

// 监听书签变化
chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
  console.log('新书签创建:', bookmark)
  // 可以在这里自动同步到Supabase
})

chrome.bookmarks.onRemoved.addListener((id) => {
  console.log('书签已删除:', id)
})

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  console.log('书签已更新:', id, changeInfo)
})
