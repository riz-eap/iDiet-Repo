// src/components/ApiStatus.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { API_BASE_URL } from '../config';

export default function ApiStatus() {
  const [status, setStatus] = useState({
    backend: 'Checking...',
    endpoints: 'Checking...',
    color: 'gray'
  });

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        // Check backend root health using service when possible (it is resilient)
        const h = await api.health();
        if (!h || !h.ok) {
          if (!mounted) return;
          setStatus({ backend: 'Offline', endpoints: 'Cannot check endpoints', color: 'red' });
          return;
        }

        const endpoints = ['/api/profile', '/api/workout-plan', '/api/meal-plan'];
        let available = 0;

        // Attach auth header if token exists (helps checking protected endpoints)
        const token = localStorage.getItem('afp_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        for (const ep of endpoints) {
          try {
            const res = await fetch(`${API_BASE_URL}${ep}`, { method: 'GET', headers });
            if (res.ok) available++;
          } catch (err) {
            // ignore per-endpoint failures
            // console.debug('endpoint check failed', ep, err);
          }
        }

        const color = available === endpoints.length ? 'green' : 'orange';
        if (!mounted) return;
        setStatus({ backend: 'Online (Connected)', endpoints: `${available}/${endpoints.length} available`, color });
      } catch (err) {
        if (!mounted) return;
        console.error('ApiStatus check error', err);
        setStatus({ backend: 'Offline', endpoints: 'Cannot check endpoints', color: 'red' });
      }
    }

    // initial check and interval
    check();
    const id = setInterval(check, 10000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="card">
      <div className="card-header"><h3>API Status</h3></div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div>
          <strong>Backend:</strong>{' '}
          <span style={{ color: status.color }}>{status.backend}</span>
        </div>
        <div>
          <strong>Endpoints:</strong>{' '}
          <span style={{ color: status.color }}>{status.endpoints}</span>
        </div>
      </div>
    </div>
  );
}
