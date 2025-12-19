import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './components/ThemeContext'
import RegistrationFormEnhanced from './pages/RegistrationFormEnhanced'
import AdminEnhanced from './pages/AdminEnhanced'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<RegistrationFormEnhanced />} />
                <Route path="camp/:campId" element={<RegistrationFormEnhanced />} />
                <Route path="admin" element={<AdminEnhanced />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
