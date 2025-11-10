// server.js — FINAL INLINE VERSION (no CSV, fully self-contained)
// ES module backend for AI Diet Planner

import express from "express";
import cors from "cors";

const app = express();

// -------------------- CORS --------------------
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// -------------------- AUTH --------------------
const DEV_BYPASS_TOKEN = "dev-bypass-token";

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === "test@example.com" && password === "TestPassword123") {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: "Test User", email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (token === DEV_BYPASS_TOKEN) {
    req.user = { id: 1, email: "test@example.com" };
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// -------------------- WORKOUT DATABASE --------------------
// 2000 sample workouts (trimmed to representative data for readability here).
// Replace with your real 2000 datapoints if you have them ready.
const WORKOUTS = [];
const intensities = ["light", "moderate", "intense"];
const types = ["cardio", "strength", "core", "mobility", "balance"];
for (let i = 1; i <= 2000; i++) {
  const intensity = intensities[Math.floor(Math.random() * intensities.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const duration = Math.floor(Math.random() * 30) + 10; // 10–40 mins
  const calories = Math.floor(duration * (intensity === "intense" ? 10 : intensity === "moderate" ? 8 : 5));
  WORKOUTS.push({
    id: i,
    name: `${type.toUpperCase()} Workout ${i}`,
    description: `${intensity} ${type} routine focused on endurance and stamina`,
    type,
    intensity,
    duration,
    calories
  });
}

// -------------------- HELPERS --------------------
function computeBMI(weight, height_cm) {
  const h = height_cm / 100;
  if (!h) return 0;
  return +(weight / (h * h)).toFixed(2);
}

function selectIntensity(goal, bmi) {
  goal = (goal || "").toLowerCase();
  if (goal.includes("gain")) return "moderate";
  if (goal.includes("maintain")) return "light";
  if (goal.includes("lose")) {
    if (bmi >= 30) return "intense";
    if (bmi >= 25) return "moderate";
    return "light";
  }
  return "moderate";
}

function pickWorkouts(intensity, count = 5) {
  const filtered = WORKOUTS.filter(w => w.intensity === intensity);
  if (filtered.length === 0) return [];
  const chosen = [];
  for (let i = 0; i < count; i++) {
    const rand = filtered[Math.floor(Math.random() * filtered.length)];
    chosen.push(rand);
  }
  return chosen;
}

function estimateCalories(weight, height, age, gender, activity) {
  const isMale = gender?.toLowerCase() === "male";
  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[activity] || 1.55;
  return Math.round(bmr * mult);
}

function generateMealPlan(targetCalories) {
  const meals = [
    { name: "Breakfast", description: "Oatmeal with banana", portion: 0.3 },
    { name: "Lunch", description: "Grilled chicken with rice", portion: 0.35 },
    { name: "Dinner", description: "Fish and vegetables", portion: 0.25 },
    { name: "Snack", description: "Greek yogurt or nuts", portion: 0.1 }
  ];
  return {
    daily_calories: targetCalories,
    meals: meals.map(m => ({
      ...m,
      calories: Math.round(targetCalories * m.portion)
    }))
  };
}

// -------------------- IN-MEMORY LAST STATE --------------------
let LAST_GENERATED = {
  profile: null,
  workout_plan: null,
  meal_plan: null,
  generated_at: null
};

// -------------------- ROUTES --------------------
app.get("/", (req, res) => res.send("✅ AI Diet Planner backend running with 2000 in-memory workouts"));

app.post("/api/generate-plan", requireAuth, (req, res) => {
  try {
    const { age, weight, height, gender, goal, activityLevel } = req.body || {};
    if (!age || !weight || !height) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const bmi = computeBMI(weight, height);
    const intensity = selectIntensity(goal, bmi);
    const workouts = pickWorkouts(intensity, 5);

    const maintenance = estimateCalories(weight, height, age, gender, activityLevel);
    let targetCalories = maintenance;
    if (goal.toLowerCase().includes("lose")) targetCalories -= 500;
    if (goal.toLowerCase().includes("gain")) targetCalories += 300;
    targetCalories = Math.max(1200, targetCalories);

    const mealPlan = generateMealPlan(targetCalories);

    LAST_GENERATED = {
      profile: { age, weight, height, gender, goal, activityLevel, bmi },
      workout_plan: { intensity, workouts },
      meal_plan: mealPlan,
      generated_at: new Date().toISOString()
    };

    return res.json({
      message: "Plan generated",
      ...LAST_GENERATED
    });
  } catch (err) {
    console.error("Error generating plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Public GET endpoints for frontend (no auth required)
app.get("/api/workout-plan", (req, res) => {
  if (LAST_GENERATED.workout_plan) return res.json(LAST_GENERATED.workout_plan);
  return res.status(404).json({ error: "No workout plan generated yet" });
});

app.get("/api/meal-plan", (req, res) => {
  if (LAST_GENERATED.meal_plan) return res.json(LAST_GENERATED.meal_plan);
  return res.status(404).json({ error: "No meal plan generated yet" });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`💪 Loaded ${WORKOUTS.length} in-memory workouts`);
});
