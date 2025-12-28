import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA with auto-update
registerSW({
  onNeedRefresh() {
    // If we needed to prompt user, we'd do it here. 
    // But with autoUpdate, this might not be needed?
    // Actually with autoUpdate, it just updates.
    // But let's keep it simple.
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)