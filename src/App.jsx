import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App(){
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 p-6">
        <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Captcha Demo</h1>
          <nav className="space-x-3 text-sm">
            <Link to="/register" className="text-slate-700">Register</Link>
            <Link to="/login" className="text-slate-700">Login</Link>
            <Link to="/dashboard" className="text-slate-700">Dashboard</Link>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto bg-white p-6 rounded shadow-sm">
          <Routes>
            <Route path="/" element={<div>Open <Link to="/register" className="text-blue-600">Register</Link></div>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/dashboard" element={<Dashboard/>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
