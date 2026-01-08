// 内容脚本 - 可以在网页中注入功能
console.log("智能书签管理器内容脚本已加载");

// 可以在这里添加页面上的快捷操作，比如快速添加当前页面为书签
// 示例：监听消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getPageInfo") {
    sendResponse({
      title: document.title,
      url: window.location.href,
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") || "",
    });
  }
  return true;
});
