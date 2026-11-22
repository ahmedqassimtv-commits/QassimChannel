import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SoundProvider } from './context/SoundContext'
import './index.css'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

// الانكسار الحقيقي للزجاج (backdrop-filter: url()) شغال على Chromium بس
if (typeof navigator !== 'undefined') {
  const brands = navigator.userAgentData?.brands?.map((b) => b.brand).join(' ') ?? ''
  if (/Chromium|Google Chrome|Microsoft Edge|Opera/.test(brands)) document.documentElement.classList.add('qz-chromium')
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SoundProvider><App /></SoundProvider>
  </React.StrictMode>,
)
