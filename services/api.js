import { API_BASE_URL } from '../config';


async function safeFetch(endpoint, opts = {}) {
const url = `${API_BASE_URL}${endpoint}`;
const res = await fetch(url, opts);
if (!res.ok) throw new Error(`API error ${res.status}`);
return await res.json();
}


export const api = {
health: async () => {
try {
const res = await fetch(`${API_BASE_URL}/`);
return { ok: res.ok };
} catch { return { ok: false }; }
},
profile: async () => safeFetch('/api/profile'),
workoutPlan: async () => safeFetch('/api/workout-plan'),
mealPlan: async () => safeFetch('/api/meal-plan'),
generatePlan: async (user) => {
const res = await fetch(`${API_BASE_URL}/api/generate-plan`, {
method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user)
});
if (!res.ok) throw new Error('Generate failed');
return await res.json();
}
}
