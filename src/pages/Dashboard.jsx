import React, { useEffect, useState, useRef } from 'react'
import api from '../api'
import Profile from './Profile'
import Settings from './Settings'
import Reports from './Reports'
import Help from './Help'

export default function Dashboard(){
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  })
  
  const [token] = useState(() => localStorage.getItem('authToken'))
  const [cal, setCal] = useState(null)
  const [globalCountdown, setGlobalCountdown] = useState(null)
  const [reservingId, setReservingId] = useState(null)
  const countdownRef = useRef(null)
  const [page, setPage] = useState('overview')

  useEffect(() => { 
    if (!user || !token) { 
      window.location.href = '/login'; 
      return;
    } 
    loadCal();
  }, [])

  async function loadCal() {
    try {
      const r = await api.call('/api/calendar');
      
      if (r && r.error) {
        console.error('Calendar error:', r.error);
        return;
      }
      
      setCal(r);

      // Check if there are any available slots
      const hasAvailable = r?.months
        ?.flatMap(m => m.days || [])
        ?.some(d => d.status === 'available');
      
      if (hasAvailable) {
        setGlobalCountdown(10);
      } else {
        setGlobalCountdown(null);
      }
    } catch (err) {
      console.error('Load calendar error:', err);
      setGlobalCountdown(null);
    }
  }

  async function reserve(dateId) {
    // Stop the global countdown
    if (countdownRef.current) { 
      clearInterval(countdownRef.current); 
      countdownRef.current = null;
    }
    setGlobalCountdown(null);

    setReservingId(dateId);
    
    try {
      const r = await api.call('/api/calendar/reserve', { 
        method: 'POST', 
        data: { token, dateId } 
      });
      
      if (r && r.error) {
        alert(r.error);
        setReservingId(null);
        return;
      }
      
      // Success - reload calendar
      setReservingId(null);
      await loadCal();
    } catch (err) {
      console.error('Reserve error:', err);
      alert('Failed to reserve date');
      setReservingId(null);
    }
  }

  // Global countdown effect
  useEffect(() => {
    if (countdownRef.current) { 
      clearInterval(countdownRef.current); 
      countdownRef.current = null;
    }

    if (globalCountdown === null || globalCountdown === undefined) {
      return undefined;
    }

    countdownRef.current = setInterval(() => {
      setGlobalCountdown(prev => {
        if (prev === null) return null;
        
        if (prev <= 1) {
          if (countdownRef.current) { 
            clearInterval(countdownRef.current); 
            countdownRef.current = null;
          }

          // Mark all available dates as unavailable
          setCal(prevCal => {
            if (!prevCal) return prevCal;
            
            return {
              ...prevCal,
              months: prevCal.months.map(m => ({
                ...m,
                days: m.days.map(d => ({
                  ...d,
                  status: d.status === 'available' ? 'unavailable' : d.status
                }))
              }))
            };
          });

          return null;
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => { 
      if (countdownRef.current) { 
        clearInterval(countdownRef.current); 
        countdownRef.current = null;
      } 
    };
  }, [globalCountdown]);

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/';
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div>
          <span className="text-sm mr-3 text-slate-600">
            Signed in as <strong>{user.name}</strong>
          </span>
          <button 
            className="text-sm border px-3 py-1 hover:bg-slate-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-72 p-4 rounded border bg-white shadow-sm">
          <div className="mb-4">
            <div className="text-sm text-slate-500">Hello</div>
            <div className="text-lg font-semibold">{user.name}</div>
          </div>

          <nav className="mb-4">
            <ul className="space-y-1 text-sm">
              {['overview', 'calendar', 'profile', 'reports', 'settings', 'help'].map(p => (
                <li key={p}>
                  <button
                    onClick={() => setPage(p)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      page === p 
                        ? 'bg-slate-100 font-semibold' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 border-t pt-4">
            <div className="text-xs text-slate-500 mb-2 font-semibold">
              Calendar (compact)
            </div>
            
            <div className="space-y-3 max-h-64 overflow-auto">
              {globalCountdown !== null && (
                <div className="mb-2 p-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded">
                  ⚠️ All available slots will become unavailable in {globalCountdown}s
                </div>
              )}
              
              {cal ? (
                cal.months?.map(m => (
                  <div key={m.label} className="p-2 border rounded bg-slate-50">
                    <div className="text-sm font-semibold mb-1">{m.label}</div>
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      {m.days?.map(d => (
                        <div 
                          key={d.id}
                          className={`p-1 border rounded text-center ${
                            d.status !== 'available' 
                              ? 'bg-slate-100 text-slate-400' 
                              : 'bg-white'
                          }`}
                        >
                          <div className="text-[10px]">{d.date}</div>
                          <div className="text-[9px] mt-1">{d.status}</div>
                          
                          {d.status === 'available' && (
                            <div className="mt-1">
                              <button
                                disabled={reservingId === d.id}
                                className={`text-[10px] text-white px-2 py-0.5 rounded ${
                                  reservingId === d.id 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                                onClick={() => reserve(d.id)}
                              >
                                {reservingId === d.id ? '...' : 'Book'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">Loading calendar…</div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1 p-4 rounded border bg-white min-h-[380px] shadow-sm">
          {page === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Welcome, {user.name}</h3>
              <p className="text-sm text-slate-600 mb-4">
                This is your dashboard overview. Use the sidebar to navigate.
              </p>
              <div className="border rounded p-3 text-sm text-slate-700">
                Quick actions: Reserve dates, view reports, or change settings from the sidebar.
              </div>
            </div>
          )}

          {page === 'calendar' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Full Calendar</h3>
              
              <div className="grid gap-4">
                {globalCountdown !== null && (
                  <div className="mb-3 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded">
                    ⚠️ No selection in progress — {globalCountdown}s remaining before all slots lock.
                  </div>
                )}
                
                {cal ? (
                  cal.months?.map(m => (
                    <div key={m.label} className="p-3 border rounded">
                      <div className="font-semibold mb-2">{m.label}</div>
                      <div className="grid grid-cols-5 gap-2">
                        {m.days?.map(d => (
                          <div 
                            key={d.id}
                            className={`p-2 border rounded ${
                              d.status === 'available' 
                                ? 'bg-white' 
                                : 'bg-slate-200'
                            }`}
                          >
                            <div className="text-sm font-medium">{d.date}</div>
                            <div className="text-xs text-slate-500">
                              {d.status}{d.holder ? ' — by you' : ''}
                            </div>
                            
                            {d.status === 'available' && (
                              <div className="mt-2">
                                <button
                                  disabled={reservingId === d.id}
                                  className={`w-full text-xs text-white px-2 py-1 rounded ${
                                    reservingId === d.id 
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-blue-600 hover:bg-blue-700'
                                  }`}
                                  onClick={() => reserve(d.id)}
                                >
                                  {reservingId === d.id ? 'Reserving...' : 'Reserve'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">Loading calendar…</div>
                )}
              </div>
            </div>
          )}

          {page === 'profile' && <Profile />}
          {page === 'settings' && <Settings />}
          {page === 'reports' && <Reports />}
          {page === 'help' && <Help />}
        </section>
      </div>
    </div>
  );
}