import React, { useState, useEffect } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })
  const [registrationId, setRegistrationId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qa, setQa] = useState([
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' }
  ])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = sessionStorage.getItem('registrationId');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      setRegistrationId(stored);
    }
  }, [])

  async function submitStep1(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      // Validate passwords match
      if (form.password !== form.confirmPassword) {
        setMsg('Passwords do not match!')
        setLoading(false)
        return
      }

      if (form.password.length < 6) {
        setMsg('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      const res = await api.call('/api/register-stage1', { 
        method: 'POST', 
        data: form 
      })

      if (res && res.error) {
        setMsg(res.error)
        setLoading(false)
        return
      }

      if (!res || !res.registrationId) {
        setMsg('Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Success - save registration ID
      setRegistrationId(res.registrationId)
      sessionStorage.setItem('registrationId', res.registrationId)

      // Load security questions
      const q = await api.call('/api/questions')
      
      if (q && q.questions) {
        setQuestions(q.questions)
        setStep(2)
      } else {
        setMsg('Failed to load security questions')
      }
    } catch (err) {
      console.error('Register step 1 error:', err)
      setMsg('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function submitStep2(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      // Validate all questions answered
      const allAnswered = qa.every(x => x.q && x.a && x.a.trim() !== '')
      if (!allAnswered) {
        setMsg('Please answer all security questions')
        setLoading(false)
        return
      }

      if (!registrationId) {
        setMsg('Registration session expired. Please start again.')
        setStep(1)
        setLoading(false)
        return
      }

      const answers = qa.map((x, i) => ({
        question: x.q || questions[i],
        answer: x.a
      }))

      const res = await api.call('/api/register-stage2', { 
        method: 'POST', 
        data: { registrationId, answers } 
      })

      if (res && res.error) {
        setMsg(res.error)
        setLoading(false)
        return
      }

      // Success!
      sessionStorage.removeItem('registrationId')
      setMsg('✅ Registration complete! Redirecting to login...')
      
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      console.error('Register step 2 error:', err)
      setMsg('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Register - Step {step} of 2
      </h2>
      
      {msg && (
        <div className={`mb-4 p-3 rounded border ${
          msg.includes('✅') 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {msg}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={submitStep1} className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 6 characters"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter password"
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Continue to Step 2'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submitStep2} className="grid grid-cols-1 gap-3">
          <div className="text-sm text-slate-600 mb-2">
            Choose 3 security questions and provide answers
          </div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 border rounded bg-slate-50">
              <label className="block text-sm font-medium mb-2">
                Question {i + 1}
              </label>
              <select
                value={qa[i].q}
                onChange={e => {
                  const copy = [...qa]
                  copy[i].q = e.target.value
                  setQa(copy)
                }}
                className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">-- Select a question --</option>
                {questions.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>

              <input
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your answer"
                value={qa[i].a}
                onChange={e => {
                  const copy = [...qa]
                  copy[i].a = e.target.value
                  setQa(copy)
                }}
                required
                disabled={loading}
              />
            </div>
          ))}

          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Completing...' : 'Finish Registration'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border rounded hover:bg-slate-50 disabled:bg-gray-100"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
