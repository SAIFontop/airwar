import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initNuiBridge } from './bridge/nui'
import './index.css'

initNuiBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
