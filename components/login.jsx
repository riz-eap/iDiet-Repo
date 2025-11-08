// src/components/Login.jsx
import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Save token
      localStorage.setItem('afp_token', data.token);
      localStorage.setItem('afp_user', JSON.stringify(data.user));

      onLogin && onLogin(data.user);
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{maxWidth:420, margin:'0 auto'}}>
      <h3>Sign in</h3>
      <form onSubmit={submit}>
        <label className="small">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        <label className="small" style={{marginTop:8}}>Password</label>
        <input className="input" value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
        <div style={{marginTop:8,display:'flex',gap:8}}>
          <button className="btn btn-accent" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          <button type="button" className="btn" onClick={()=>{ setEmail('test@example.com'); setPassword('TestPassword123'); }}>Fill Test</button>
        </div>
      </form>
    </div>
  );
}
