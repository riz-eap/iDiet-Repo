// server.js (ES module)
import express from 'express';
import cors from 'cors';

const app = express();

// ========== CORS ==========
const allowedOrigins = [
  'http://localhost:8000',
  'http://127.0.0.1:5500',
  'https://riz-eap.github.io',
  'https://idiet-repo.onrender.com'
];

// TEMP: permissive CORS for dev/testing. Reduce for production.
app.use(cors({
  origin: function(origin, callback){
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // For safety, allow all while developing by uncommenting the next line:
    // return callback(null, true);
    return callback(new Error('CORS: Not allowed by origin'));
  },
  credentials: true,
}));
app.options('*', cors());

// body parser
app.use(express.json());

// ========== In-memory sample data (demo) ==========
let userProfile = {
  age: 28, weight: 70, height: 175, gender: 'male', goal: 'lose_weight', activityLevel: 'moderate'
};

let workoutPlan = {
  name: "Full Body Workout",
  exercises: [
    { name: "Push-ups", description: "Chest and triceps", sets: 3, reps: 12, type: "Bodyweight" },
    { name: "Squats", description: "Legs and glutes", sets: 3, reps: 15, type: "Bodyweight" },
    { name: "Plank", description: "Core stability", duration: 60, type: "Core" }
  ]
};

let mealPlan = {
  daily_calories: 2000,
  meals: [
    { name: "Breakfast", description: "Oatmeal with fruit", calories: 400, protein: 20, carbs: 50, fats: 10 },
    { name: "Lunch", description: "Grilled chicken with rice", calories: 600, protein: 45, carbs: 70, fats: 15 },
    { name: "Dinner", description: "Salmon with veggies", calories: 500, protein: 35, carbs: 30, fats: 20 }
  ]
};

// ========== Simple auth & middleware ==========

const DEV_BYPASS_TOKEN = 'dev-bypass-token';

// Simple login route — in real app replace with DB + bcrypt + JWT
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  // NOTE: this is a demo login only. Replace with real DB verification.
  if (email === 'test@example.com' && password === 'TestPassword123') {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: 'Test User', email } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// explicit bypass route (optional)
app.post('/api/auth/login-test-bypass', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'test@example.com' && password === 'TestPassword123') {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: 'Test User', email } });
  }
  return res.status(401).json({ error: 'Invalid bypass credentials' });
});

// auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (auth || null);

  // Accept dev bypass token
  if (token === DEV_BYPASS_TOKEN) {
    req.user = { id: 1, email: 'test@example.com', name: 'Test User' };
    return next();
  }

  // In production you'd verify JWT here. For now reject unknown tokens.
  if (!token) return res.status(401).json({ error: 'Missing token' });
  return res.status(401).json({ error: 'Unauthorized' });
}

// ========== Public root ==========
app.get('/', (req, res) => res.send('Backend online'));

// ========== Protected endpoints ==========
app.get('/api/profile', requireAuth, (req, res) => {
  // return profile (in real app use req.user.id)
  res.json(userProfile);
});

app.get('/api/workout-plan', requireAuth, (req, res) => {
  res.json(workoutPlan);
});

app.get('/api/meal-plan', requireAuth, (req, res) => {
  res.json(mealPlan);
});

app.post('/api/generate-plan', requireAuth, (req, res) => {
  const { age, weight, height, gender, goal, activityLevel } = req.body || {};
  // update stored profile and dummy-generate plans (replace with AI logic)
  userProfile = { age, weight, height, gender, goal, activityLevel };
  // Simple generation heuristic example:
  workoutPlan = {
    name: "Generated Plan",
    exercises: [
      { name: "Jumping Jacks", description: "Warmup", sets: 3, reps: 30, type: "cardio" },
      { name: "Bodyweight Squats", description: "Leg strength", sets: 4, reps: 12, type: "strength" }
    ]
  };
  mealPlan = {
    daily_calories: 2000,
    meals: [
      { name: "Breakfast", description: "Yogurt + fruit", calories: 350, protein: 15, carbs: 50, fats: 8 },
      { name: "Lunch", description: "Chicken salad", calories: 600, protein: 45, carbs: 40, fats: 18 },
      { name: "Dinner", description: "Vegetable stir fry + rice", calories: 550, protein: 20, carbs: 80, fats: 12 }
    ]
  };
  res.json({ message: 'Plan generated (demo)' });
});

// start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
