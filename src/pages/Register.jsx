import React, { useState, useEffect } from 'react'
import api from '../api'

export default function Register(){
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'' })
  const [registrationId, setRegistrationId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qa, setQa] = useState([{q:'', a:''},{q:'', a:''},{q:'', a:''}])
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    const stored = sessionStorage.getItem('registrationId');
    if (stored && stored !== 'undefined') setRegistrationId(stored);
  },[])

  async function submitStep1(e){
    e.preventDefault(); setMsg('');
    const res = await api.call('/api/register-stage1', { method: 'POST', data: form });
    if (res && res.error) return setMsg(res.error);
    setRegistrationId(res.registrationId);
    sessionStorage.setItem('registrationId', res.registrationId);
    const q = await api.call('/api/questions');
    if (q && q.questions) setQuestions(q.questions);
    setStep(2);
  }

  async function submitStep2(e){
    e.preventDefault(); setMsg('');
    const answers = qa.map((x, i)=> ({ question: x.q || questions[i], answer: x.a }));
    const res = await api.call('/api/register-stage2', { method: 'POST', data: { registrationId, answers } });
    if (res && res.error) return setMsg(res.error);
    sessionStorage.removeItem('registrationId');
    setMsg('Registration complete — you can now login.');
    setStep(1); setForm({ name:'', email:'', password:'', confirmPassword:'' });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Register (Stage {step})</h2>
      {msg && <div className="mb-4 text-red-600">{msg}</div>}
      {step===1 && (
        <form onSubmit={submitStep1} className="grid grid-cols-1 gap-3">
          <input className="p-2 border" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <input className="p-2 border" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required type="email" />
          <input className="p-2 border" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required type="password" />
          <input className="p-2 border" placeholder="Confirm password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} required type="password" />
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Continue to stage 2</button>
          </div>
        </form>
      )}
      {step===2 && (
        <form onSubmit={submitStep2} className="grid grid-cols-1 gap-3">
          <div className="text-sm text-slate-600">Choose 3 questions and provide answers</div>
          {Array.from({length:3}).map((_,i)=> (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={qa[i].q} onChange={e=>{ const copy=[...qa]; copy[i].q=e.target.value; setQa(copy);}} className="p-2 border">
                <option value="">Select question</option>
                {questions.map(q=> <option key={q} value={q}>{q}</option>)}
              </select>
              <input className="p-2 border" placeholder="Answer" value={qa[i].a} onChange={e=>{ const copy=[...qa]; copy[i].a=e.target.value; setQa(copy);}} required />
            </div>
          ))}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded" type="submit">Finish Registration</button>
            <button type="button" className="px-4 py-2 border rounded" onClick={()=>{ setStep(1); }}>Back</button>
          </div>
        </form>
      )}
    </div>
  )
}
