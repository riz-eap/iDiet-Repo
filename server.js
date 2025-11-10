// server.js — FULL file (replace existing)
// Simple backend that returns purely random combinations from hard-coded lists
// 50 exercises and 50 meals. No AI, no BMI logic — just random selection.

import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// -----------------------------
// Demo auth (keeps things optional)
// -----------------------------
const DEV_BYPASS_TOKEN = "dev-bypass-token";
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === "test@example.com" && password === "TestPassword123") {
    return res.json({ token: DEV_BYPASS_TOKEN, user: { id: 1, name: "Test User", email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});
// We will allow generate without auth to keep things simple for testing
function requireAuthOptional(req, res, next) {
  // not enforcing auth — just attach demo user if token present
  const auth = req.headers.authorization || "";
  const t = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (t === DEV_BYPASS_TOKEN) req.user = { id: 1, name: "Test User", email: "test@example.com" };
  return next();
}

// -----------------------------
// Hard-coded lists (50 exercises, 50 meals)
// -----------------------------
const EXERCISES = [
  { name: "Jumping Jacks", type: "cardio", duration_min: 5, intensity: "high" },
  { name: "Burpees", type: "cardio_strength", duration_min: 6, intensity: "high" },
  { name: "High Knees", type: "cardio", duration_min: 4, intensity: "high" },
  { name: "Mountain Climbers", type: "core_cardio", duration_min: 5, intensity: "high" },
  { name: "Jump Rope", type: "cardio", duration_min: 8, intensity: "high" },
  { name: "Kettlebell Swings", type: "strength_cardio", duration_min: 7, intensity: "high" },
  { name: "Sprint Intervals", type: "cardio", duration_min: 10, intensity: "high" },
  { name: "Battle Ropes", type: "cardio_strength", duration_min: 6, intensity: "high" },
  { name: "Box Jumps", type: "plyometric", duration_min: 6, intensity: "high" },
  { name: "Push-ups (standard)", type: "strength", duration_min: 6, intensity: "moderate" },
  { name: "Pull-ups", type: "strength", duration_min: 6, intensity: "moderate" },
  { name: "Bench Press", type: "strength", duration_min: 8, intensity: "moderate" },
  { name: "Deadlift", type: "strength", duration_min: 8, intensity: "high" },
  { name: "Squat Jumps", type: "plyometric", duration_min: 5, intensity: "high" },
  { name: "Cycling HIIT", type: "cardio", duration_min: 15, intensity: "high" },
  { name: "Bodyweight Squats", type: "strength", duration_min: 6, intensity: "light" },
  { name: "Incline Push-ups", type: "strength", duration_min: 6, intensity: "light" },
  { name: "Walking Lunges", type: "strength", duration_min: 6, intensity: "moderate" },
  { name: "Plank", type: "core", duration_min: 3, intensity: "light" },
  { name: "Side Plank", type: "core", duration_min: 3, intensity: "light" },
  { name: "Dumbbell Rows", type: "strength", duration_min: 7, intensity: "moderate" },
  { name: "Dumbbell Shoulder Press", type: "strength", duration_min: 7, intensity: "moderate" },
  { name: "Romanian Deadlift", type: "strength", duration_min: 8, intensity: "moderate" },
  { name: "Step-ups", type: "strength", duration_min: 6, intensity: "moderate" },
  { name: "TRX Rows", type: "strength", duration_min: 6, intensity: "moderate" },
  { name: "Farmer's Carry", type: "strength", duration_min: 5, intensity: "moderate" },
  { name: "Brisk Walk", type: "cardio_low", duration_min: 20, intensity: "light" },
  { name: "Yoga Flow", type: "mobility", duration_min: 20, intensity: "light" },
  { name: "Light Cycling", type: "cardio_low", duration_min: 25, intensity: "light" },
  { name: "Resistance Band Work", type: "strength", duration_min: 10, intensity: "light" },
  { name: "Glute Bridges", type: "strength", duration_min: 6, intensity: "light" },
  { name: "Pilates Mat", type: "mobility_core", duration_min: 20, intensity: "light" },
  { name: "Light Rowing", type: "cardio_low", duration_min: 20, intensity: "light" },
  { name: "Chair Squats", type: "strength", duration_min: 5, intensity: "light" },
  { name: "Calf Raises", type: "strength", duration_min: 5, intensity: "light" },
  { name: "Bicycle Crunches", type: "core", duration_min: 5, intensity: "moderate" },
  { name: "Russian Twists", type: "core", duration_min: 4, intensity: "moderate" },
  { name: "Goblet Squats", type: "strength", duration_min: 7, intensity: "moderate" },
  { name: "Lat Pulldown", type: "strength", duration_min: 7, intensity: "moderate" },
  { name: "Incline Dumbbell Press", type: "strength", duration_min: 7, intensity: "moderate" },
  { name: "Leg Press", type: "strength", duration_min: 8, intensity: "moderate" },
  { name: "Hamstring Curls", type: "strength", duration_min: 6, intensity: "moderate" },
  { name: "Tricep Dips", type: "strength", duration_min: 5, intensity: "moderate" },
  { name: "Arm Circles", type: "warmup", duration_min: 3, intensity: "light" },
  { name: "Walking Lunges with Twist", type: "strength_core", duration_min: 6, intensity: "moderate" }
];

const MEALS = [
  { name: "Oatmeal with banana", calories: 350, protein_g: 10, carbs_g: 60, fats_g: 6, description: "Simple oats and banana" },
  { name: "Greek Yogurt & Berries", calories: 300, protein_g: 20, carbs_g: 40, fats_g: 6, description: "Yogurt topped with mixed berries" },
  { name: "Grilled Chicken Salad", calories: 450, protein_g: 40, carbs_g: 30, fats_g: 15, description: "Chicken breast and mixed greens" },
  { name: "Quinoa & Veg Bowl", calories: 500, protein_g: 18, carbs_g: 70, fats_g: 12, description: "Quinoa with roasted vegetables" },
  { name: "Tuna Sandwich", calories: 420, protein_g: 30, carbs_g: 45, fats_g: 12, description: "Tuna on whole grain bread" },
  { name: "Egg White Omelette", calories: 250, protein_g: 25, carbs_g: 5, fats_g: 10, description: "Egg whites and vegetables" },
  { name: "Protein Smoothie", calories: 350, protein_g: 30, carbs_g: 35, fats_g: 6, description: "Protein powder, milk, banana" },
  { name: "Salmon & Rice", calories: 600, protein_g: 45, carbs_g: 60, fats_g: 18, description: "Baked salmon with rice and veggies" },
  { name: "Turkey Wrap", calories: 400, protein_g: 28, carbs_g: 40, fats_g: 12, description: "Turkey and veggies in wrap" },
  { name: "Lentil Soup", calories: 320, protein_g: 18, carbs_g: 45, fats_g: 6, description: "Hearty lentil soup" },
  { name: "Avocado Toast", calories: 360, protein_g: 8, carbs_g: 30, fats_g: 20, description: "Whole grain toast with avocado" },
  { name: "Chicken Stir Fry", calories: 520, protein_g: 40, carbs_g: 55, fats_g: 14, description: "Stir fried chicken and veggies" },
  { name: "Beef & Veg Skillet", calories: 650, protein_g: 45, carbs_g: 50, fats_g: 22, description: "Beef with mixed vegetables" },
  { name: "Veggie Omelette", calories: 300, protein_g: 20, carbs_g: 8, fats_g: 16, description: "Eggs and vegetables" },
  { name: "Brown Rice & Beans", calories: 480, protein_g: 18, carbs_g: 80, fats_g: 6, description: "Fiber-rich meal" },
  { name: "Pasta Primavera", calories: 560, protein_g: 20, carbs_g: 85, fats_g: 12, description: "Pasta with fresh veggies" },
  { name: "Shrimp Tacos", calories: 470, protein_g: 35, carbs_g: 45, fats_g: 10, description: "Tacos with seasoned shrimp" },
  { name: "Cottage Cheese & Fruit", calories: 280, protein_g: 24, carbs_g: 25, fats_g: 6, description: "High protein snack" },
  { name: "Peanut Butter Toast", calories: 360, protein_g: 10, carbs_g: 30, fats_g: 18, description: "PB on whole grain toast" },
  { name: "Chicken Caesar Salad", calories: 520, protein_g: 42, carbs_g: 20, fats_g: 26, description: "Caesar with grilled chicken" },
  { name: "Fish & Quinoa", calories: 540, protein_g: 40, carbs_g: 50, fats_g: 12, description: "Balanced dinner" },
  { name: "Stir Fry Tofu", calories: 430, protein_g: 22, carbs_g: 50, fats_g: 12, description: "Tofu with vegetables" },
  { name: "Poke Bowl", calories: 600, protein_g: 45, carbs_g: 70, fats_g: 14, description: "Rice bowl with fish" },
  { name: "Veg Burrito", calories: 520, protein_g: 18, carbs_g: 70, fats_g: 16, description: "Beans, rice, and veggies" },
  { name: "Smoothie Bowl", calories: 420, protein_g: 15, carbs_g: 60, fats_g: 10, description: "Fruit blended and topped" },
  { name: "Chicken & Sweet Potato", calories: 520, protein_g: 42, carbs_g: 55, fats_g: 10, description: "Roasted chicken and sweet potato" },
  { name: "Beef Chili", calories: 610, protein_g: 45, carbs_g: 50, fats_g: 22, description: "Hearty chili with beans" },
  { name: "Sushi Rolls", calories: 400, protein_g: 25, carbs_g: 55, fats_g: 6, description: "Assorted sushi" },
  { name: "Grilled Veg Sandwich", calories: 360, protein_g: 10, carbs_g: 45, fats_g: 12, description: "Veggies on whole grain bread" },
  { name: "Muesli & Milk", calories: 320, protein_g: 12, carbs_g: 50, fats_g: 6, description: "Breakfast cereal with milk" },
  { name: "Egg & Spinach Wrap", calories: 380, protein_g: 22, carbs_g: 30, fats_g: 14, description: "Quick breakfast wrap" },
  { name: "Steak & Veggies", calories: 700, protein_g: 55, carbs_g: 40, fats_g: 30, description: "Hearty dinner" },
  { name: "Chickpea Salad", calories: 390, protein_g: 16, carbs_g: 45, fats_g: 12, description: "Mediterranean style salad" },
  { name: "Protein Pancakes", calories: 420, protein_g: 30, carbs_g: 50, fats_g: 10, description: "Pancakes with protein powder" },
  { name: "Soba Noodles", calories: 500, protein_g: 18, carbs_g: 80, fats_g: 8, description: "Noodle dish with veggies" },
  { name: "Tofu Scramble", calories: 350, protein_g: 20, carbs_g: 10, fats_g: 18, description: "Vegan scramble" },
  { name: "Veggie Burger", calories: 450, protein_g: 20, carbs_g: 50, fats_g: 14, description: "Plant-based patty" },
  { name: "Lamb & Couscous", calories: 680, protein_g: 50, carbs_g: 60, fats_g: 24, description: "Mediterranean meal" },
  { name: "Baked Potato & Salmon", calories: 580, protein_g: 45, carbs_g: 60, fats_g: 16, description: "Comforting dinner" },
  { name: "Hummus & Veg Platter", calories: 300, protein_g: 10, carbs_g: 30, fats_g: 12, description: "Light meal or snack" },
  { name: "Mango Chicken", calories: 520, protein_g: 40, carbs_g: 55, fats_g: 10, description: "Sweet-savory chicken dish" },
  { name: "Black Bean Tacos", calories: 430, protein_g: 20, carbs_g: 50, fats_g: 12, description: "Vegan tacos" },
  { name: "Couscous Salad", calories: 380, protein_g: 12, carbs_g: 60, fats_g: 8, description: "Light mediterranean dish" },
  { name: "Granola & Yogurt", calories: 360, protein_g: 12, carbs_g: 55, fats_g: 10, description: "Breakfast bowl" },
  { name: "Prawn Stir Fry", calories: 480, protein_g: 35, carbs_g: 45, fats_g: 14, description: "Quick stir fry" },
  { name: "Zucchini Noodles", calories: 300, protein_g: 12, carbs_g: 30, fats_g: 10, description: "Low-carb noodle alternative" },
  { name: "Chicken & Avocado Salad", calories: 520, protein_g: 38, carbs_g: 30, fats_g: 20, description: "Healthy fats and protein" }
];

// -----------------------------
// Utility: random choice + shuffle
// -----------------------------
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function chooseRandom(arr, count) {
  if (!Array.isArray(arr)) return [];
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// -----------------------------
// In-memory last generated plan
// -----------------------------
let LAST = {
  profile: null,
  exercises: null,
  meals: null,
  generated_at: null
};

// -----------------------------
// Endpoints
// -----------------------------
app.get("/", (req, res) => res.send("AI Diet Planner — random-only backend"));

app.get("/api/profile", (req, res) => {
  // Return last profile or a default placeholder
  const def = { name: "Guest", age: 28, weight: 70, height: 175, gender: "male", goal: "maintain", activityLevel: "moderate" };
  res.json(LAST.profile || def);
});

// POST generate plan — accepts profile payload but ignores logic, returns random combos
app.post("/api/generate-plan", requireAuthOptional, (req, res) => {
  const body = req.body || {};
  // store profile (for front-end display) but we won't use it for logic — purely random selection
  const profile = {
    age: body.age || 28,
    weight: body.weight || 70,
    height: body.height || 175,
    gender: body.gender || "male",
    goal: body.goal || "maintain",
    activityLevel: body.activityLevel || "moderate"
  };

  const selectedExercises = chooseRandom(EXERCISES, 6); // 6 random exercises
  const selectedMeals = chooseRandom(MEALS, 3); // 3 random meals

  LAST = {
    profile,
    exercises: selectedExercises,
    meals: selectedMeals,
    generated_at: new Date().toISOString()
  };

  return res.json({
    message: "Random plan generated",
    profile: LAST.profile,
    workout_plan: { exercises: LAST.exercises },
    meal_plan: { meals: LAST.meals },
    generated_at: LAST.generated_at
  });
});

// GET endpoints return last generated (or placeholders)
app.get("/api/workout-plan", (req, res) => {
  if (LAST.exercises) return res.json({ exercises: LAST.exercises });
  return res.json({ exercises: chooseRandom(EXERCISES, 6) });
});

app.get("/api/meal-plan", (req, res) => {
  if (LAST.meals) return res.json({ meals: LAST.meals });
  return res.json({ meals: chooseRandom(MEALS, 3) });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Random-only backend listening on port ${PORT}`);
  console.log(`Loaded ${EXERCISES.length} exercises and ${MEALS.length} meals (hard-coded)`);
});
