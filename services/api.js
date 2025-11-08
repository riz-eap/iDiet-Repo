// services/api.js (modify safeFetch or add auth header)
import { API_BASE_URL } from '../config';

function authHeaders() {
  const token = localStorage.getItem('afp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(endpoint, opts = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}), ...authHeaders() };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return await res.json();
}

export const api = {
  health: async () => { /* unchanged */ },
  profile: async () => safeFetch('/api/profile'),
  workoutPlan: async () => safeFetch('/api/workout-plan'),
  mealPlan: async () => safeFetch('/api/meal-plan'),
  generatePlan: async (user) => { /* keep as before but will include auth headers */ }
};
