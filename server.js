// server.js
/**
 * Full-featured server.js
 * - CORS properly configured
 * - /api/auth/login -> checks Postgres users table with bcrypt + returns JWT
 * - demo endpoints for profile, workout-plan, meal-plan (fallback/in-memory)
 * - serves React build from /build
 *
 * Make sure to set environment variables in Render:
 * - DATABASE_URL (optional, otherwise fallback below)
 * - JWT_SECRET (optional, default 'change_this_secret')
 */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ---------- Configuration ----------
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Use DATABASE_URL env if available, otherwise fallback to the external DB URL you provided.
// It's better to set DATABASE_URL in Render's environment settings.
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://idiet_db_user:i9R4UtzIjPRpeqyDDf0MMQhFS7YVOXrA@dpg-d47kd02dbo4c73f9eg2g-a.oregon-postgres.render.com/idiet_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false
});

// ---------- CORS ----------
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  // your GitHub Pages or deployed frontend origin(s) - add your real values here:
  'https://riz-eap.github.io',
  'https://riz-eap.github.io/iDiet-Repo',
  // It's okay to include the backend host if same-origin requests happen:
  `https://idiet-repo.onrender.com`
];

// Dynamic origin check
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      // In production you may want to log and restrict more tightly
      console.warn('Blocked CORS origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept','X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Ensure preflight is handled
app.options('*', cors());

// JSON body parsing
app.use(express.json());

// ---------- Helper: DB query wrapper ----------
async function queryDb(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// ---------- Authentication: POST /api/auth/login ----------
/**
 * Expects JSON body: { email, password }
 * Returns: { token, user } on success
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Query user by email
    const q = await queryDb('SELECT id, name, email, password, password_hash FROM users WHERE email = $1 LIMIT 1', [email]);
    const userRow = q.rows[0];

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Determine which column holds the bcrypt hash
    const hash = userRow.password || userRow.password_hash;
    if (!hash) {
      // no password stored
      return res.status(500).json({ error: 'No password hash stored for user' });
    }

    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Build user object to return (omit sensitive fields)
    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email
    };

    // Sign JWT (valid for 7 days)
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Middleware: simple auth for protected routes ----------
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------- API endpoints (protected where appropriate) ----------
// Try to read values from DB; if DB tables missing or empty, fall back to the in-memory demo data.

let demoProfile = {
  age: 28,
  weight: 70,
  height: 175,
  gender: 'male',
  goal: 'lose_weight',
  activityLevel: 'moderate'
};

let demoWorkoutPlan = {
  name: "Full Body Workout",
  exercises: [
    { name: "Push-ups", description: "Chest and triceps", sets: 3, reps: 12, type: "Bodyweight" },
    { name: "Squats", description: "Legs and glutes", sets: 3, reps: 15, type: "Bodyweight" },
    { name: "Plank", description: "Core stability", duration: 60, type: "Core" }
  ]
};

let demoMealPlan = {
  daily_calories: 2000,
  meals: [
    { name: "Breakfast", description: "Oatmeal with fruit", calories: 400, protein: 20, carbs: 50, fats: 10 },
    { name: "Lunch", description: "Grilled chicken with rice", calories: 600, protein: 45, carbs: 70, fats: 15 },
    { name: "Dinner", description: "Salmon with veggies", calories: 500, protein: 35, carbs: 30, fats: 20 }
  ]
};

app.get('/', (req, res) => res.send('Backend online'));

// GET profile for logged-in user (protected)
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const q = await queryDb('SELECT age, weight, height, gender, goal, activity_level FROM profiles WHERE user_id = $1 LIMIT 1', [userId]);
    if (q.rows.length) {
      const r = q.rows[0];
      return res.json({
        age: r.age,
        weight: r.weight,
        height: r.height,
        gender: r.gender,
        goal: r.goal,
        activityLevel: r.activity_level
      });
    } else {
      // fallback demo
      return res.json(demoProfile);
    }
  } catch (err) {
    console.error('/api/profile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET workout-plan for logged-in user (protected)
app.get('/api/workout-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const q = await queryDb('SELECT name, exercises FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    if (q.rows.length) {
      return res.json(q.rows[0]);
    } else {
      return res.json(demoWorkoutPlan);
    }
  } catch (err) {
    console.error('/api/workout-plan error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET meal-plan for logged-in user (protected)
app.get('/api/meal-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const q = await queryDb('SELECT daily_calories, meals FROM meal_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    if (q.rows.length) {
      return res.json(q.rows[0]);
    } else {
      return res.json(demoMealPlan);
    }
  } catch (err) {
    console.error('/api/meal-plan error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST generate-plan (protected) - stores a simple plan in DB (or updates demo)
app.post('/api/generate-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { age, weight, height, gender, goal, activityLevel } = req.body;

    // For simplicity, generate a trivial plan and insert
    const generatedWorkout = {
      name: 'Generated Plan',
      exercises: [
        { name: 'Jumping Jacks', description: 'Warm up', sets: 3, reps: 30, type: 'cardio' }
      ]
    };
    const generatedMeal = {
      daily_calories: 2000,
      meals: [
        { name: 'Generated Breakfast', description: 'Example', calories: 400, protein: 20, carbs: 50, fats: 10 }
      ]
    };

    // insert into DB if tables exist
    try {
      await queryDb(
        'INSERT INTO workout_plans (user_id, name, exercises) VALUES ($1, $2, $3::jsonb)',
        [userId, generatedWorkout.name, JSON.stringify(generatedWorkout.exercises)]
      );
      await queryDb(
        'INSERT INTO meal_plans (user_id, daily_calories, meals) VALUES ($1, $2, $3::jsonb)',
        [userId, generatedMeal.daily_calories, JSON.stringify(generatedMeal.meals)]
      );
      // update profile table if exists
      await queryDb(
        `INSERT INTO profiles (user_id, age, weight, height, gender, goal, activity_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id) DO UPDATE SET age=EXCLUDED.age, weight=EXCLUDED.weight, height=EXCLUDED.height, gender=EXCLUDED.gender, goal=EXCLUDED.goal, activity_level=EXCLUDED.activity_level`,
        [userId, age, weight, height, gender, goal, activityLevel]
      );
      return res.json({ message: 'Plan generated and saved' });
    } catch (dbErr) {
      console.warn('DB insert failed (tables may not exist):', dbErr.message);
      // fallback: update demo
      demoProfile = { age, weight, height, gender, goal, activityLevel };
      demoWorkoutPlan = generatedWorkout;
      demoMealPlan = generatedMeal;
      return res.json({ message: 'Plan generated (in-memory fallback)' });
    }
  } catch (err) {
    console.error('/api/generate-plan error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Serve React build (after API routes) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'build')));

// If no route matched above, serve the SPA index (useful for React Router)
app.get('*', (req, res) => {
  // if it's an API route, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`✅ Backend running on ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  // test DB connection
  pool.connect()
    .then(client => { client.release(); console.log('Connected to DB'); })
    .catch(err => console.warn('DB connection warning:', err.message));
});
