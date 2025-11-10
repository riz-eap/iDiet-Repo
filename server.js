// server.js — FULL file (replace your existing file)
// Random-only backend with realistic macro ranges and reasonable exercise reps/sets.

import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// ------------------------- utility helpers -------------------------
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

// ------------------------- templates -------------------------
const EXERCISE_NAMES = [
  "Jumping Jacks", "Burpees", "High Knees", "Mountain Climbers", "Push-ups",
  "Pull-ups", "Bodyweight Squats", "Walking Lunges", "Plank", "Sit-ups",
  "Crunches", "Bench Press", "Bicep Curls", "Tricep Dips", "Overhead Press",
  "Deadlift", "Kettlebell Swings", "Box Jumps", "Jump Rope", "Rowing Machine",
  "Cycling Intervals", "Battle Ropes", "Step-ups", "Glute Bridges", "Farmer's Carry",
  "TRX Rows", "Russian Twists", "Bicycle Crunches", "Leg Press", "Hamstring Curls",
  "Dumbbell Shoulder Press", "Goblet Squats", "Lat Pulldown", "Incline Push-ups", "Wall Sit",
  "Arm Circles", "Calf Raises", "Chair Squats", "Light Jog", "Sprint Intervals",
  "Pilates Core", "Yoga Flow", "Resistance Band Rows", "Incline Dumbbell Press", "Front Raises",
  "Plank Shoulder Tap", "Bear Crawl", "Skater Jumps", "Side Plank", "Walking"
];

const MEAL_NAMES = [
  "Oatmeal with Banana", "Greek Yogurt & Berries", "Grilled Chicken Salad", "Quinoa & Veg Bowl",
  "Tuna Sandwich", "Egg White Omelette", "Protein Smoothie", "Salmon & Rice", "Turkey Wrap",
  "Lentil Soup", "Avocado Toast", "Chicken Stir Fry", "Beef & Veg Skillet", "Veggie Omelette",
  "Brown Rice & Beans", "Pasta Primavera", "Shrimp Tacos", "Cottage Cheese & Fruit", "Peanut Butter Toast",
  "Chicken Caesar Salad", "Fish & Quinoa", "Tofu Stir Fry", "Poke Bowl", "Veg Burrito", "Smoothie Bowl",
  "Chicken & Sweet Potato", "Beef Chili", "Sushi Rolls", "Grilled Veg Sandwich", "Muesli & Milk",
  "Egg & Spinach Wrap", "Steak & Veggies", "Chickpea Salad", "Protein Pancakes", "Soba Noodles",
  "Tofu Scramble", "Veggie Burger", "Baked Potato & Salmon", "Hummus & Veg Platter", "Mango Chicken",
  "Black Bean Tacos", "Couscous Salad", "Granola & Yogurt", "Prawn Stir Fry", "Zucchini Noodles",
  "Chicken & Avocado Salad", "Falafel Bowl", "Rice & Beans", "Cauliflower Curry", "Lentil & Quinoa Salad"
];

const INTENSITIES = ["light", "moderate", "high"];
const TYPES = ["cardio", "strength", "core", "mobility", "balance"];

// ------------------------- realistic random generators -------------------------

// For exercises: choose sets, reps and duration depending on type/intensity
function generateExerciseInstance(name) {
  const type = randomChoice(TYPES);
  const intensity = randomChoice(INTENSITIES);

  // Reasonable ranges:
  // - strength moves: reps lower (6-15), sets 2-5
  // - cardio: duration higher (10-40), reps not applicable (we'll still give reps but in higher range)
  // - core/mobility: shorter durations, reps 10-30
  let sets = randomBetween(1, 5);
  let reps;
  let duration_min;

  if (type === "strength") {
    reps = randomBetween(6, 15);            // realistic strength reps
    duration_min = randomBetween(5, 20);    // duration per exercise block
  } else if (type === "cardio") {
    reps = randomBetween(10, 40);           // rounds or intervals
    duration_min = randomBetween(10, 40);   // cardio duration
    sets = 1;                               // sets not usually used for steady cardio
  } else if (type === "core") {
    reps = randomBetween(8, 25);
    duration_min = randomBetween(4, 15);
  } else if (type === "mobility") {
    reps = randomBetween(8, 20);
    duration_min = randomBetween(5, 20);
    sets = randomBetween(1, 3);
  } else { // balance
    reps = randomBetween(6, 20);
    duration_min = randomBetween(4, 15);
  }

  // calories burned estimate for that exercise instance: keep reasonable 30-600
  // Use a small heuristic: intensity multiplier
  const intensityMult = intensity === "high" ? 1.2 : intensity === "moderate" ? 1.0 : 0.8;
  let calories_burned = Math.round(duration_min * (intensityMult * (type === "cardio" ? 8 : 6)));
  calories_burned = Math.max(30, Math.min(600, calories_burned));

  return {
    name,
    type,
    intensity,
    sets,
    reps,
    duration_min,
    calories_burned,
    description: `${name} — ${intensity} ${type} exercise, ${sets} sets x ${reps} reps (or ${duration_min} min).`
  };
}

// For meals: generate macros within realistic ranges and ensure calories match macros
function generateMealInstance(name) {
  // Pick macros within realistic bounds:
  // protein: 10-60g, carbs: 15-120g, fats: 5-40g
  const protein = randomBetween(10, 60);
  const carbs = randomBetween(15, 120);
  const fats = randomBetween(5, 40);

  // Compute calories from macros (4 kcal/g protein/carbs, 9 kcal/g fat)
  let calories = protein * 4 + carbs * 4 + fats * 9;

  // Clamp total calories to a sensible meal range (200 - 800)
  if (calories < 200) {
    // scale up proportionally to reach minimum
    const scale = 200 / Math.max(1, calories);
    // scale macros but keep integers
    const p = Math.max(10, Math.round(protein * scale));
    const c = Math.max(15, Math.round(carbs * scale));
    const f = Math.max(5, Math.round(fats * scale));
    const newCalories = p * 4 + c * 4 + f * 9;
    return {
      name,
      description: `${name} — balanced meal.`,
      calories: Math.min(800, newCalories),
      protein_g: p,
      carbs_g: c,
      fats_g: f
    };
  }

  if (calories > 800) {
    // scale down proportionally
    const scale = 800 / calories;
    const p = Math.max(10, Math.round(protein * scale));
    const c = Math.max(15, Math.round(carbs * scale));
    const f = Math.max(5, Math.round(fats * scale));
    const newCalories = p * 4 + c * 4 + f * 9;
    return {
      name,
      description: `${name} — balanced meal.`,
      calories: Math.max(200, Math.min(800, newCalories)),
      protein_g: p,
      carbs_g: c,
      fats_g: f
    };
  }

  // otherwise original macros are fine
  return {
    name,
    description: `${name} — balanced meal.`,
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fats_g: fats
  };
}

// ------------------------- in-memory last plan -------------------------
let LAST_PLAN = {
  profile: null,
  workout_plan: null,
  meal_plan: null,
  generated_at: null
};

// ------------------------- routes -------------------------
app.get("/", (req, res) => res.send("AI Diet Planner — realistic random backend"));

app.get("/api/profile", (req, res) => {
  const defaultProfile = {
    name: "Guest",
    age: 28,
    weight: 70,
    height: 175,
    gender: "male",
    goal: "maintain",
    activityLevel: "moderate"
  };
  res.json(LAST_PLAN.profile || defaultProfile);
});

// allow generate without auth for testing
app.post("/api/generate-plan", (req, res) => {
  const body = req.body || {};
  // keep profile for display only
  const profile = {
    age: body.age || 28,
    weight: body.weight || 70,
    height: body.height || 175,
    gender: body.gender || "male",
    goal: body.goal || "maintain",
    activityLevel: body.activityLevel || "moderate"
  };

  // pick 6 random exercises and 3 random meals
  const chosenExerciseNames = chooseRandom(EXERCISE_NAMES, 6);
  const chosenMealNames = chooseRandom(MEAL_NAMES, 3);

  const exercises = chosenExerciseNames.map(generate
