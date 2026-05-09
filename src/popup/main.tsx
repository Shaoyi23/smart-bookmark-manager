import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const detectMode = () => {
  const params = new URLSearchParams(window.location.search)
  const explicitMode = params.get('view')

  if (explicitMode === 'popup') {
    document.body.setAttribute('data-mode', 'popup')
    return
  }

  if (explicitMode === 'sidepanel') {
    document.body.setAttribute('data-mode', 'sidepanel')
    return
  }

  document.body.setAttribute('data-mode', 'drawer')
}

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
