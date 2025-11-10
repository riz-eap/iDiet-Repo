// server.js — full file (replace existing)
// Note: this file intentionally exposes GET /api/workout-plan and /api/meal-plan without auth
// so that frontend calls from GitHub Pages won't return 404 while you're testing.

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();

/* ========== CORS (permissive for dev) ========== */
app.use(cors({
  origin: true,
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

/* ========== Simple demo auth ========== */
const DEV_BYPASS_TOKEN = 'dev-bypass-token';

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'test@example.com' && password === 'TestPassword123') {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: 'Test User', email } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (token === DEV_BYPASS_TOKEN) {
    req.user = { id: 1, email: 'test@example.com', name: 'Test User' };
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

/* ========== CSV loader (simple quoted CSV parser) ========== */
const CSV_PATH = path.join(process.cwd(), 'data', 'workout_plans_2000.csv');
let WORKOUT_PLANS = [];

function parseCSVQuoted(raw) {
  const rows = [];
  let i = 0, N = raw.length;
  let inQuotes = false, field = '', current = [];
  while (i < N) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < N && raw[i+1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { field += ch; i++; continue; }
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { current.push(field); field = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { current.push(field); rows.push(current); current = []; field = ''; i++; continue; }
      field += ch; i++;
    }
  }
  if (field !== '' || current.length > 0) { current.push(field); rows.push(current); }
  return rows;
}

function loadWorkoutCSV() {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      console.warn('CSV not found at', CSV_PATH);
      WORKOUT_PLANS = [];
      return;
    }
    const raw = fs.readFileSync(CSV_PATH, 'utf8');
    const rows = parseCSVQuoted(raw);
    if (!rows || rows.length < 2) {
      console.warn('CSV seems empty or invalid');
      WORKOUT_PLANS = [];
      return;
    }
    const header = rows[0].map(h => String(h).trim());
    const dataRows = rows.slice(1);
    WORKOUT_PLANS = dataRows.map((cols, idx) => {
      const obj = {};
      for (let j = 0; j < header.length; j++) obj[header[j]] = (j < cols.length) ? cols[j] : '';
      let exercises = [];
      try { exercises = obj.exercises_json ? JSON.parse(obj.exercises_json) : []; } catch (e) { exercises = []; }
      return {
        plan_id: Number(obj.plan_id) || (idx+1),
        plan_name: obj.plan_name || `Plan #${idx+1}`,
        intensity: (obj.intensity || '').toLowerCase(),
        focus_area: obj.focus_area || '',
        total_duration_min: Number(obj.total_duration_min) || 0,
        est_calories: Number(obj.est_calories) || 0,
        exercises
      };
    });
    console.log(`✅ Loaded ${WORKOUT_PLANS.length} workout plans from CSV`);
  } catch (err) {
    console.error('❌ Error loading CSV:', err && err.message ? err.message : err);
    WORKOUT_PLANS = [];
  }
}
loadWorkoutCSV();

/* Watchfile in dev only — safe to keep */
try {
  fs.watchFile(CSV_PATH, { interval: 2000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      console.log('CSV changed — reloading');
      loadWorkoutCSV();
    }
  });
} catch (e) { /* ignore */ }

/* ========== Helper logic ========== */
function computeBMI(weight, height_cm) {
  const h = height_cm/100; if (!h || !weight) return null;
  return +(weight / (h*h)).toFixed(2);
}

function selectIntensity(profile, bmi) {
  const goal = (profile.goal || '').toLowerCase();
  if (goal.includes('gain')) return 'moderate';
  if (goal.includes('maintain')) return 'light
