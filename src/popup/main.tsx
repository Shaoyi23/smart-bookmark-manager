import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 检测运行模式并设置data-mode属性
const detectMode = () => {
  // 检查是否在侧边栏中（侧边栏通常有特定的窗口特征）
  if (window.location.pathname.includes('sidepanel') || 
      window.innerWidth > 800) {
    document.body.setAttribute('data-mode', 'sidepanel')
  } else {
    document.body.setAttribute('data-mode', 'popup')
  }
}

// 在DOM加载后检测
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectMode)
} else {
  detectMode()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

