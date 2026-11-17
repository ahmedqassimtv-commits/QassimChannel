import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SoundProvider } from './context/SoundContext'
import './index.css'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SoundProvider><App /></SoundProvider>
  </React.StrictMode>,
)
