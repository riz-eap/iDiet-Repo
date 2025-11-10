// server.js (ES module)
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const app = express();

// ==================== CORS ====================
const allowedOrigins = [
  'http://localhost:8000',
  'http://127.0.0.1:5500',
  'https://riz-eap.github.io',
  'https://idiet-repo.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // Uncomment below to allow all origins during development:
    // return callback(null, true);
    return callback(new Error('CORS: Not allowed by origin'));
  },
  credentials: true,
}));
app.options('*', cors());
app.use(express.json());

// ==================== AUTH SETUP ====================
const DEV_BYPASS_TOKEN = 'dev-bypass-token';

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'test@example.com' && password === 'TestPassword123') {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: 'Test User', email } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/login-test-bypass', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'test@example.com' && password === 'TestPassword123') {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: 'Test User', email } });
  }
  return res.status(401).json({ error: 'Invalid bypass credentials' });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (token === DEV_BYPASS_TOKEN) {
    req.user = { id: 1, email: 'test@example.com', name: 'Test User' };
    return next();
  }
  if (!token) return res.status(401).json({ error: 'Missing token' });
  return res.status(401).json({ error: 'Unauthorized' });
}

// ==================== LOAD CSV DATA ====================
const CSV_PATH = path.join(process.cwd(), 'data', 'workout_plans_2000.csv');
let WORKOUT_PLANS = [];

function loadWorkoutCSV() {
  try {
    const raw = fs.readFileSync(CSV_PATH, 'utf8');
    const rows = parse(raw, { columns: true, skip_empty_lines: true });
    WORKOUT_PLANS = rows.map(r => {
      let exercises = [];
      try { exercises = JSON.parse(r.exercises_json || '[]'); } catch (e) { exercises = []; }
      return {
        plan_id: Number(r.plan_id),
        plan_name: r.plan_name,
        intensity: (r.intensity || '').toLowerCase(),
        focus_area: r.focus_area || '',
        total_duration_min: Number(r.total_duration_min) || 0,
        est_calories: Number(r.est_calories) || 0,
        exercises
      };
    });
    console.log(`✅ Loaded ${WORKOUT_PLANS.length} workout plans from CSV`);
  } catch (err) {
    console.error('❌ Failed to load CSV:', err.message);
    WORKOUT_PLANS = [];
  }
}
loadWorkoutCSV();

// ==================== HELPER FUNCTIONS ====================
function computeBMI(weight, height_cm) {
  const h = height_cm / 100;
  return +(weight / (h * h)).toFixed(2);
}

function selectIntensity(profile, bmi) {
  const goal = (profile.goal || '').toLowerCase();
  if (goal.includes('gain')) return 'moderate';
  if (goal.includes('maintain')) return 'light';
  if (goal.includes('lose')) {
    if (bmi >= 30) return 'intense';
    if (bmi >= 25) return 'moderate';
    return 'light';
  }
  return 'moderate';
}

function pickWorkoutPlan(intensity, focus = null) {
  const candidates = WORKOUT_PLANS.filter(p => p.intensity === intensity);
  if (!candidates.length) return WORKOUT_PLANS[Math.floor(Math.random() * WORKOUT_PLANS.length)];
  if (focus) {
    const match = candidates.filter(p => p.focus_area.toLowerCase() === focus.toLowerCase());
    if (match.length) return match[Math.floor(Math.random() * match.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function estimateCalories(weight, height, age, gender, activity) {
  const bmr = (gender === 'male')
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityMult = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
  };
  return Math.round(bmr * (activityMult[activity] || 1.55));
}

function generateMealPlan(targetCalories) {
  const proteinPerc = 0.3, fatPerc = 0.25, carbPerc = 0.45;
  const proteinC = targetCalories * proteinPerc;
  const fatC = targetCalories * fatPerc;
  const carbC = targetCalories * carbPerc;

  const proteinG = Math.round(proteinC / 4);
  const fatG = Math.round(fatC / 9);
  const carbG = Math.round(carbC / 4);

  return {
    daily_calories: targetCalories,
    macros_percent: { protein: 30, fats: 25, carbs: 45 },
    meals: [
      { name: 'Breakfast', description: 'Oatmeal with fruit', calories: Math.round(targetCalories * 0.3), protein: Math.round(proteinG * 0.3), carbs: Math.round(carbG * 0.3), fats: Math.round(fatG * 0.3) },
      { name: 'Lunch', description: 'Grilled chicken + rice', calories: Math.round(targetCalories * 0.35), protein: Math.round(proteinG * 0.35), carbs: Math.round(carbG * 0.35), fats: Math.round(fatG * 0.35) },
      { name: 'Dinner', description: 'Fish + vegetables', calories: Math.round(targetCalories * 0.3), protein: Math.round(proteinG * 0.3), carbs: Math.round(carbG * 0.3), fats: Math.round(fatG * 0.3) },
      { name: 'Snack', description: 'Yogurt or nuts', calories: Math.round(targetCalories * 0.05), protein: Math.round(proteinG * 0.05), carbs: Math.round(carbG * 0.05), fats: Math.round(fatG * 0.05) }
    ]
  };
}

// ==================== PUBLIC ROUTE ====================
app.get('/', (req, res) => res.send('Backend online and CSV loaded'));

// ==================== PROTECTED ROUTES ====================
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ message: 'Profile endpoint', user: req.user });
});

app.post('/api/generate-plan', requireAuth, (req, res) => {
  const { age, weight, height, gender, goal, activityLevel, focus_area } = req.body || {};
  if (!age || !weight || !height) {
    return res.status(400).json({ error: 'Missing user parameters' });
  }

  const bmi = computeBMI(weight, height);
  const intensity = selectIntensity({ goal }, bmi);
  const plan = pickWorkoutPlan(intensity, focus_area);
  const maintenance = estimateCalories(weight, height, age, gender, activityLevel);
  let targetCalories = maintenance;
  if ((goal || '').toLowerCase().includes('lose')) targetCalories -= 500;
  else if ((goal || '').toLowerCase().includes('gain')) targetCalories += 300;
  targetCalories = Math.max(1200, Math.round(targetCalories));

  const mealPlan = generateMealPlan(targetCalories);

  return res.json({
    profile: { age, weight, height, gender, goal, activityLevel, bmi },
    workout_plan: plan,
    meal_plan: mealPlan,
    generated_at: new Date().toISOString()
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
