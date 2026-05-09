chrome.runtime.onInstalled.addListener(() => {
  console.log('智能书签管理器已安装')
})

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    })

    await chrome.tabs.sendMessage(tab.id, { action: 'toggleDrawer' })
  } catch (error) {
    console.error('打开书签抽屉失败:', error)
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
