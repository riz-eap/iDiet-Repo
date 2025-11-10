// ✅ FINAL PURE RANDOM BACKEND (with realistic value ranges)
// - 50 random exercise templates
// - 50 random meal templates
// - Each call randomizes reps, sets, duration, intensity, macros, calories

import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// =====================================================
// Helper random generators
// =====================================================
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function chooseRandom(arr, count) {
  return shuffle(arr).slice(0, Math.min(arr.length, count));
}

// =====================================================
// Base template arrays
// =====================================================
const EXERCISE_NAMES = [
  "Jumping Jacks", "Burpees", "High Knees", "Mountain Climbers", "Push-ups",
  "Pull-ups", "Bodyweight Squats", "Lunges", "Plank", "Sit-ups",
  "Crunches", "Bench Press", "Bicep Curls", "Tricep Dips", "Overhead Press",
  "Leg Press", "Calf Raises", "Side Plank", "Glute Bridge", "Jump Rope",
  "Rowing Machine", "Elliptical", "Cycling", "Box Jumps", "Deadlift",
  "Kettlebell Swings", "Resistance Band Rows", "Battle Ropes", "Yoga Flow", "Pilates Core",
  "Jogging", "Sprint Intervals", "Walking", "Stretching", "Step-ups",
  "Wall Sit", "Plank Shoulder Tap", "Incline Push-up", "Farmer’s Carry", "Bear Crawl",
  "Skater Jumps", "Shoulder Shrugs", "Incline Dumbbell Press", "Arnold Press", "Chin-ups",
  "Goblet Squats", "Front Raises", "Leg Extension", "Side Lateral Raises", "Dumbbell Row"
];

const MEAL_NAMES = [
  "Oatmeal with Banana", "Greek Yogurt & Berries", "Grilled Chicken Salad", "Quinoa Bowl", "Tuna Sandwich",
  "Egg White Omelette", "Protein Smoothie", "Salmon with Rice", "Turkey Wrap", "Lentil Soup",
  "Avocado Toast", "Chicken Stir Fry", "Beef Skillet", "Veggie Omelette", "Brown Rice & Beans",
  "Pasta Primavera", "Shrimp Tacos", "Cottage Cheese & Fruit", "Peanut Butter Toast", "Chicken Caesar Salad",
  "Fish & Quinoa", "Stir Fry Tofu", "Poke Bowl", "Veg Burrito", "Smoothie Bowl",
  "Chicken & Sweet Potato", "Beef Chili", "Sushi Rolls", "Veg Sandwich", "Muesli & Milk",
  "Egg & Spinach Wrap", "Steak & Veggies", "Chickpea Salad", "Protein Pancakes", "Soba Noodles",
  "Tofu Scramble", "Veggie Burger", "Lamb & Couscous", "Baked Potato & Salmon", "Hummus & Veg Platter",
  "Mango Chicken", "Black Bean Tacos", "Couscous Salad", "Granola & Yogurt", "Prawn Stir Fry",
  "Zucchini Noodles", "Chicken & Avocado Salad", "Falafel Bowl", "Rice & Beans", "Cauliflower Curry"
];

const INTENSITIES = ["light", "moderate", "high"];
const TYPES = ["cardio", "strength", "core", "mobility", "balance"];

// =====================================================
// Core random generators for exercise & meal
// =====================================================
function generateRandomExercise(name) {
  return {
    name,
    type: randomChoice(TYPES),
    intensity: randomChoice(INTENSITIES),
    sets: randomBetween(1, 5),
    reps: randomBetween(5, 100),
    duration_min: randomBetween(5, 40),
    calories_burned: randomBetween(40, 890),
    description: `${name} — ${randomChoice(["full body", "upper body", "lower body", "core-focused", "cardio-based"])} workout`
  };
}

function generateRandomMeal(name) {
  return {
    name,
    description: `${name} with random healthy twist`,
    calories: randomBetween(40, 890),
    protein_g: randomBetween(5, 100),
    carbs_g: randomBetween(5, 100),
    fats_g: randomBetween(5, 100)
  };
}

// =====================================================
// State memory for last generated plan
// =====================================================
let LAST_PLAN = {
  profile: null,
  workout_plan: null,
  meal_plan: null,
  generated_at: null
};

// =====================================================
// Routes
// =====================================================
app.get("/", (req, res) => res.send("✅ AI Diet Planner — Full Random Edition (50×50 random sets)"));

app.get("/api/profile", (req, res) => {
  const defaultProfile = {
    name: "Guest User",
    age: 28,
    weight: 70,
    height: 175,
    gender: "male",
    goal: "maintain",
    activityLevel: "moderate"
  };
  res.json(LAST_PLAN.profile || defaultProfile);
});

// ---------------- Generate Plan ----------------
app.post("/api/generate-plan", (req, res) => {
  const { age, weight, height, gender, goal, activityLevel } = req.body || {};

  const profile = {
    age: age || randomBetween(18, 60),
    weight: weight || randomBetween(45, 120),
    height: height || randomBetween(150, 190),
    gender: gender || randomChoice(["male", "female"]),
    goal: goal || randomChoice(["lose", "maintain", "gain"]),
    activityLevel: activityLevel || randomChoice(["light", "moderate", "high"])
  };

  const randomExercises = chooseRandom(EXERCISE_NAMES, 6).map(generateRandomExercise);
  const randomMeals = chooseRandom(MEAL_NAMES, 3).map(generateRandomMeal);

  LAST_PLAN = {
    profile,
    workout_plan: { exercises: randomExercises },
    meal_plan: { meals: randomMeals },
    generated_at: new Date().toISOString()
  };

  res.json({
    message: "Random Plan Generated Successfully ✅",
    ...LAST_PLAN
  });
});

// ---------------- Get Workout & Meal ----------------
app.get("/api/workout-plan", (req, res) => {
  if (LAST_PLAN.workout_plan) return res.json(LAST_PLAN.workout_plan);
  const fallback = chooseRandom(EXERCISE_NAMES, 6).map(generateRandomExercise);
  res.json({ exercises: fallback });
});

app.get("/api/meal-plan", (req, res) => {
  if (LAST_PLAN.meal_plan) return res.json(LAST_PLAN.meal_plan);
  const fallback = chooseRandom(MEAL_NAMES, 3).map(generateRandomMeal);
  res.json({ meals: fallback });
});

// =====================================================
// Start Server
// =====================================================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🔥 Random backend running on port ${PORT}`);
  console.log(`💪 Loaded ${EXERCISE_NAMES.length} exercise templates and ${MEAL_NAMES.length} meals`);
});
