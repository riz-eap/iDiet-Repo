// server.js (single-file, copy-paste replacement)
// ES module style
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

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
    // Development convenience: uncomment to allow any origin temporarily
    // return callback(null, true);
    return callback(new Error('CORS: Not allowed by origin'));
  },
  credentials: true,
}));
app.options('*', cors());
app.use(express.json());

// ==================== AUTH (demo) ====================
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

// ==================== CSV LOADING (custom parser) ====================
const CSV_PATH = path.join(process.cwd(), 'data', 'workout_plans_2000.csv');
let WORKOUT_PLANS = [];

function parseCSVQuoted(raw) {
  // Robust CSV parser supporting quoted fields with commas/newlines.
  // Returns array of rows, each row is array of columns.
  const rows = [];
  let i = 0;
  const N = raw.length;
  let current = [];
  let field = '';
  let inQuotes = false;
  while (i < N) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        // peek next
        if (i + 1 < N && raw[i + 1] === '"') {
          // escaped quote
          field += '"';
          i += 2;
          continue;
        } else {
          // end quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ',') {
        current.push(field);
        field = '';
        i++;
        continue;
      }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') {
        current.push(field);
        rows.push(current);
        current = [];
        field = '';
        i++;
        continue;
      }
      field += ch;
      i++;
    }
  }
  // push last
  if (field !== '' || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
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
    if (!rows || rows.length === 0) {
      console.warn('CSV appears empty');
      WORKOUT_PLANS = [];
      return;
    }
    // first row header
    const header = rows[0].map(h => String(h).trim());
    const data = rows.slice(1);
    WORKOUT_PLANS = data.map((cols, idx) => {
      // Map header -> value (if fewer columns, missing become '')
      const obj = {};
      for (let j = 0; j < header.length; j++) {
        obj[header[j]] = (j < cols.length) ? cols[j] : '';
      }
      // fields expected: plan_id, plan_name, intensity, focus_area, total_duration_min, est_calories, exercises_json
      let exercises = [];
      try {
        exercises = obj.exercises_json ? JSON.parse(obj.exercises_json) : [];
      } catch (err) {
        // fallback: try unescaped trimming
        try { exercises = JSON.parse(obj.exercises_json.replace(/\t/g, '')); } catch(e){ exercises = []; }
      }
      return {
        plan_id: Number(obj.plan_id) || (idx + 1),
        plan_name: obj.plan_name || `Plan #${idx + 1}`,
        intensity: (obj.intensity || '').toLowerCase(),
        focus_area: obj.focus_area || '',
        total_duration_min: Number(obj.total_duration_min) || 0,
        est_calories: Number(obj.est_calories) || 0,
        exercises
      };
    });
    console.log(`✅ Loaded ${WORKOUT_PLANS.length} workout plans from CSV (${CSV_PATH})`);
  } catch (err) {
    console.error('❌ Error loading CSV:', err && err.message ? err.message : err);
    WORKOUT_PLANS = [];
  }
}
loadWorkoutCSV();

// Watch file for changes in development (optional)
try {
  fs.watchFile(CSV_PATH, { interval: 2000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      console.log('CSV changed on disk — reloading...');
      loadWorkoutCSV();
    }
  });
} catch (e) { /* ignore on systems that don't support watchFile */ }

// ==================== HELPERS: BMI, intensity, pick plan, calories, meals ====================
function computeBMI(weight, height_cm) {
  const h = height_cm / 100;
  if (!h || !weight) return null;
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
  // fallback by activityLevel
  const act = (profile.activityLevel || profile.activity || 'moderate').toLowerCase();
  if (act === 'very_active' || act === 'active') return 'moderate';
  if (act === 'light' || act === 'sedentary') return 'light';
  return 'moderate';
}

function pickWorkoutPlan(intensityLabel, focus = null) {
  if (!WORKOUT_PLANS || WORKOUT_PLANS.length === 0) return null;
  const candidates = WORKOUT_PLANS.filter(p => (p.intensity || '') === intensityLabel);
  if (!candidates.length) {
    // slightly prefer same focus
    const focusMatches = WORKOUT_PLANS.filter(p => p.focus_area && focus && p.focus_area.toLowerCase() === focus.toLowerCase());
    if (focusMatches.length) return focusMatches[Math.floor(Math.random() * focusMatches.length)];
    return WORKOUT_PLANS[Math.floor(Math.random() * WORKOUT_PLANS.length)];
  }
  // prefer matching focus if available
  if (focus) {
    const fm = candidates.filter(c => c.focus_area && c.focus_area.toLowerCase() === focus.toLowerCase());
    if (fm.length) return fm[Math.floor(Math.random() * fm.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function estimateMaintenanceCalories(weight_kg, height_cm, age, gender, activityLevel) {
  // Mifflin-St Jeor BMR
  const male = (String(gender || '').toLowerCase().startsWith('m'));
  const bmr = male
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const mult = multipliers[(activityLevel || 'moderate')] || 1.55;
  return Math.round(bmr * mult);
}

function generateMealPlan(targetCalories) {
  targetCalories = Math.max(1200, Math.round(targetCalories));
  const proteinPerc = 0.30, fatPerc = 0.25, carbPerc = 0.45;
  const proteinC = Math.round(targetCalories * proteinPerc);
  const fatC = Math.round(targetCalories * fatPerc);
  const carbC = Math.round(targetCalories * carbPerc);
  const proteinG = Math.round(proteinC / 4);
  const fatG = Math.round(fatC / 9);
  const carbG = Math.round(carbC / 4);

  const breakfast = Math.round(targetCalories * 0.30);
  const lunch = Math.round(targetCalories * 0.35);
  const dinner = Math.round(targetCalories * 0.30);
  const snack = Math.max(50, targetCalories - (breakfast + lunch + dinner));

  return {
    daily_calories: targetCalories,
    macros_percent: { protein: 30, carbs: 45, fats: 25 },
    meals: [
      { name: 'Breakfast', description: 'Oatmeal with banana + nuts', calories: breakfast, protein_g: Math.round(proteinG * 0.30), carbs_g: Math.round(carbG * 0.30), fats_g: Math.round(fatG * 0.30) },
      { name: 'Lunch', description: 'Grilled chicken, rice, salad', calories: lunch, protein_g: Math.round(proteinG * 0.35), carbs_g: Math.round(carbG * 0.35), fats_g: Math.round(fatG * 0.35) },
      { name: 'Dinner', description: 'Baked fish, quinoa, veggies', calories: dinner, protein_g: Math.round(proteinG * 0.30), carbs_g: Math.round(carbG * 0.30), fats_g: Math.round(fatG * 0.30) },
      { name: 'Snack', description: 'Greek yogurt or handful of nuts', calories: snack, protein_g: Math.round(proteinG * 0.05), carbs_g: Math.round(carbG * 0.05), fats_g: Math.round(fatG * 0.05) }
    ]
  };
}

// ==================== In-memory storage for last generated plan (so GET endpoints can read it) ====================
let LAST_GENERATED = {
  profile: null,
  workout_plan: null,
  meal_plan: null,
  generated_at: null
};

// ==================== PUBLIC & PROTECTED ROUTES ====================
app.get('/', (req, res) => res.send('Backend online and CSV loaded'));

// Protected GET endpoints expected by frontend
app.get('/api/workout-plan', requireAuth, (req, res) => {
  if (LAST_GENERATED.workout_plan) return res.json(LAST_GENERATED.workout_plan);
  return res.status(404).json({ error: 'No workout plan generated yet' });
});

app.get('/api/meal-plan', requireAuth, (req, res) => {
  if (LAST_GENERATED.meal_plan) return res.json(LAST_GENERATED.meal_plan);
  return res.status(404).json({ error: 'No meal plan generated yet' });
});

// Provide profile route for frontend
app.get('/api/profile', requireAuth, (req, res) => {
  return res.json({ message: 'Use POST /api/generate-plan to create profile-specific plans', user: req.user });
});

// POST /api/generate-plan — main flow
app.post('/api/generate-plan', requireAuth, (req, res) => {
  try {
    // Accept different naming for height/activity fields
    const body = req.body || {};
    const age = Number(body.age);
    const weight = Number(body.weight);
    const height = Number(body.height || body.height_cm || body.height_cm);
    const gender = body.gender || 'male';
    const goal = body.goal || 'maintain';
    const activityLevel = body.activityLevel || body.activity || 'moderate';
    const focus_area = body.focus_area || body.focusArea || null;

    if (!age || !weight || !height) {
      return res.status(400).json({ error: 'Missing required fields: age, weight, height' });
    }

    const bmi = computeBMI(weight, height);
    const intensity = selectIntensity({ goal, activityLevel }, bmi);
    const chosenPlan = pickWorkoutPlan(intensity, focus_area);
    const maintenance = estimateMaintenanceCalories(weight, height, age, gender, activityLevel);

    let targetCalories = maintenance;
    if (String(goal).toLowerCase().includes('lose')) targetCalories = maintenance - 500;
    else if (String(goal).toLowerCase().includes('gain')) targetCalories = maintenance + 300;
    targetCalories = Math.max(1200, Math.round(targetCalories));

    const mealPlan = generateMealPlan(targetCalories);

    LAST_GENERATED = {
      profile: { age, weight, height, gender, goal, activityLevel, bmi },
      workout_plan: chosenPlan || { message: 'No matching workout plan available' },
      meal_plan: mealPlan,
      generated_at: new Date().toISOString()
    };

    return res.json({
      message: 'Plan generated',
      generated_at: LAST_GENERATED.generated_at,
      profile: LAST_GENERATED.profile,
      workout_plan: LAST_GENERATED.workout_plan,
      meal_plan: LAST_GENERATED.meal_plan
    });
  } catch (err) {
    console.error('Error in /api/generate-plan:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
