// src/services/api.js
import { API_BASE_URL } from '../config';

/**
 * Helper: get auth headers if token exists
 */
function authHeaders() {
  const token = localStorage.getItem('afp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Safe fetch wrapper with JSON parsing and improved errors.
 * Throws an Error with an informative message on non-2xx responses.
 */
async function safeFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...authHeaders()
  };
  const opts = { ...options, headers };

  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    // Network-level error (CORS, offline, blocked, etc.)
    throw new Error(`Network error while fetching ${endpoint}: ${err.message}`);
  }

  // Try to parse JSON body (if any)
  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch (err) {
      // ignore JSON parse errors
      body = null;
    }
  } else {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message = (body && body.error) || (body && body.message) || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

/**
 * Public API surface used by the frontend
 */
export const api = {
  // Basic health check — returns { ok: true } or { ok: false }
  health: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      return { ok: res.ok, status: res.status };
    } catch {
      return { ok: false };
    }
  },

  // Auth: login. Returns { token, user } on success (same shape as backend)
  login: async ({ email, password }) => {
    const body = await safeFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return body;
  },

  // Get profile (may be protected)
  profile: async () => safeFetch('/api/profile', { method: 'GET' }),

  // Workout and meal plans
  workoutPlan: async () => safeFetch('/api/workout-plan', { method: 'GET' }),
  mealPlan: async () => safeFetch('/api/meal-plan', { method: 'GET' }),

  // Generate plan (POST profile)
  generatePlan: async (user) => safeFetch('/api/generate-plan', {
    method: 'POST',
    body: JSON.stringify(user)
  }),
};
