import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import RegistrationFormEnhanced from './pages/RegistrationFormEnhanced'
import AdminEnhanced from './pages/AdminEnhanced'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<RegistrationFormEnhanced />} />
            <Route path="camp/:campId" element={<RegistrationFormEnhanced />} />
            <Route path="admin" element={<AdminEnhanced />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
