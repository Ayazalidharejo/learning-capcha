import React, { useEffect, useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [captcha, setCaptcha] = useState({ svg: null, captchaId: null })
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    captchaAnswer: '' 
  })
  const [loginId, setLoginId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qa, setQa] = useState(['', '', ''])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { 
    loadCaptcha() 
  }, [])

  async function loadCaptcha() {
    try {
      const r = await api.call('/api/captcha')
      
      if (r && r.svg && r.captchaId) {
        setCaptcha({ svg: r.svg, captchaId: r.captchaId })
      } else {
        console.error('Failed to load captcha:', r)
        setMsg('Failed to load CAPTCHA. Please refresh.')
      }
    } catch (err) {
      console.error('Captcha error:', err)
      setMsg('Failed to load CAPTCHA')
    }
  }

  async function submitStep1(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      if (!captcha.captchaId) {
        setMsg('Please wait for CAPTCHA to load')
        setLoading(false)
        return
      }

      const body = { 
        username: form.username, 
        password: form.password, 
        captchaId: captcha.captchaId,
        captchaAnswer: form.captchaAnswer
      }

      const r = await api.call('/api/login-step1', { 
        method: 'POST', 
        data: body 
      })

      if (r && r.error) {
        setMsg(r.error)
        loadCaptcha() // Reload captcha on error
        setLoading(false)
        return
      }

      if (!r || !r.loginId || !r.questions) {
        setMsg('Login failed. Please try again.')
        loadCaptcha()
        setLoading(false)
        return
      }

      // Success - move to step 2
      setLoginId(r.loginId)
      setQuestions(r.questions)
      setStep(2)
      setLoading(false)

    } catch (err) {
      console.error('Login step 1 error:', err)
      setMsg('An unexpected error occurred')
      loadCaptcha()
      setLoading(false)
    }
  }

  async function submitStep2(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      // Validate all answers provided
      const allAnswered = qa.every(a => a && a.trim() !== '')
      if (!allAnswered) {
        setMsg('Please answer all security questions')
        setLoading(false)
        return
      }

      if (!loginId) {
        setMsg('Login session expired. Please try again.')
        setStep(1)
        setLoading(false)
        return
      }

      const answers = qa.map(a => a)

      const r = await api.call('/api/login-step2', { 
        method: 'POST', 
        data: { loginId, answers } 
      })

      if (r && r.error) {
        setMsg(r.error)
        setLoading(false)
        return
      }

      if (!r || !r.token || !r.user) {
        setMsg('Login verification failed')
        setLoading(false)
        return
      }

      // Success! Store auth data
      localStorage.setItem('authToken', r.token)
      localStorage.setItem('authUser', JSON.stringify(r.user))
      
      setMsg('✅ Login successful! Redirecting...')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (err) {
      console.error('Login step 2 error:', err)
      setMsg('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Login {step === 2 && '- Security Questions'}
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
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CAPTCHA</label>
            <div className="flex items-center gap-3 mb-2">
              {captcha.svg ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: captcha.svg }} 
                  className="border rounded p-2 bg-gray-50"
                />
              ) : (
                <div className="p-4 border rounded bg-gray-50 text-gray-500">
                  Loading CAPTCHA...
                </div>
              )}
              <button
                type="button"
                className="px-3 py-2 border rounded hover:bg-slate-50 text-sm disabled:bg-gray-100"
                onClick={loadCaptcha}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
            <input
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter captcha text"
              value={form.captchaAnswer}
              onChange={e => setForm({ ...form, captchaAnswer: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submitStep2} className="grid grid-cols-1 gap-3">
          {questions.map((q, i) => (
            <div key={i} className="p-3 border rounded bg-slate-50">
              <label className="block text-sm font-medium mb-2">{q}</label>
              <input
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your answer"
                value={qa[i]}
                onChange={e => {
                  const copy = [...qa]
                  copy[i] = e.target.value
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border rounded hover:bg-slate-50 disabled:bg-gray-100"
              onClick={() => {
                setStep(1)
                setQa(['', '', ''])
                loadCaptcha()
              }}
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