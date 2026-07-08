import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          theme="dark"
          richColors
          toastOptions={{ style: { background: '#16161f', border: '1px solid #262636', color: '#e2e8f0' } }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
