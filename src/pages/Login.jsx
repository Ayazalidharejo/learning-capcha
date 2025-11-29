import React, { useEffect, useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [captcha, setCaptcha] = useState({ svg: null, captchaId: null })
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ username:'', password:'', captchaAnswer: '' })
  const [loginId, setLoginId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qa, setQa] = useState(['','',''])
  const [msg, setMsg] = useState('')
  const nav = useNavigate()

  useEffect(()=>{ loadCaptcha() },[])

  async function loadCaptcha(){
    const r = await api.call('/api/captcha');
    if (r && r.svg) setCaptcha({ svg: r.svg, captchaId: r.captchaId });
  }

  async function submitStep1(e){
    e.preventDefault(); setMsg('');
    const body = {...form, captchaId: captcha.captchaId};
    const r = await api.call('/api/login-step1', { method: 'POST', data: body });
    if (r && r.error) { setMsg(r.error); loadCaptcha(); return; }
    setLoginId(r.loginId); setQuestions(r.questions); setStep(2);
  }

  async function submitStep2(e){
    e.preventDefault(); setMsg('');
    const answers = qa.map(a=>a);
    const r = await api.call('/api/login-step2', { method: 'POST', data: { loginId, answers } });
    if (r && r.error) return setMsg(r.error);
    localStorage.setItem('authToken', r.token); localStorage.setItem('authUser', JSON.stringify(r.user));
    nav('/dashboard');
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {msg && <div className="mb-4 text-red-600">{msg}</div>}
      {step===1 && (
        <form onSubmit={submitStep1} className="grid grid-cols-1 gap-3">
          <input className="p-2 border" placeholder="Email" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
          <input className="p-2 border" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required type="password" />
          <div className="flex items-center gap-3">
            <div dangerouslySetInnerHTML={{__html: captcha.svg}} />
            <input className="p-2 border" placeholder="Enter captcha" value={form.captchaAnswer} onChange={e=>setForm({...form, captchaAnswer:e.target.value})} required />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Continue</button>
            <button type="button" className="px-4 py-2 border rounded" onClick={loadCaptcha}>New Captcha</button>
          </div>
        </form>
      )}

      {step===2 && (
        <form onSubmit={submitStep2} className="grid grid-cols-1 gap-3">
          {questions.map((q, i) => (
            <div key={i}><label className="text-sm">{q}</label><input className="p-2 border w-full" value={qa[i]} onChange={e=>{ const c=[...qa]; c[i]=e.target.value; setQa(c); }} /></div>
          ))}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded" type="submit">Login</button>
          </div>
        </form>
      )}
    </div>
  )
}
