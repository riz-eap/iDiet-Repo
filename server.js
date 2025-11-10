// server.js — FULL FILE (replace your existing file)
// Random realistic backend for AI Diet Planner
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// ------------------------- utilities -------------------------
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
  "Jumping Jacks","Burpees","High Knees","Mountain Climbers","Push-ups",
  "Pull-ups","Bodyweight Squats","Walking Lunges","Plank","Sit-ups",
  "Crunches","Bench Press","Bicep Curls","Tricep Dips","Overhead Press",
  "Deadlift","Kettlebell Swings","Box Jumps","Jump Rope","Rowing Machine",
  "Cycling Intervals","Battle Ropes","Step-ups","Glute Bridges","Farmer's Carry",
  "TRX Rows","Russian Twists","Bicycle Crunches","Leg Press","Hamstring Curls",
  "Dumbbell Shoulder Press","Goblet Squats","Lat Pulldown","Incline Push-ups","Wall Sit",
  "Arm Circles","Calf Raises","Chair Squats","Light Jog","Sprint Intervals",
  "Pilates Core","Yoga Flow","Resistance Band Rows","Incline Dumbbell Press","Front Raises",
  "Plank Shoulder Tap","Bear Crawl","Skater Jumps","Side Plank","Walking"
];

const MEAL_NAMES = [
  "Oatmeal with Banana","Greek Yogurt & Berries","Grilled Chicken Salad","Quinoa & Veg Bowl",
  "Tuna Sandwich","Egg White Omelette","Protein Smoothie","Salmon & Rice","Turkey Wrap",
  "Lentil Soup","Avocado Toast","Chicken Stir Fry","Beef & Veg Skillet","Veggie Omelette",
  "Brown Rice & Beans","Pasta Primavera","Shrimp Tacos","Cottage Cheese & Fruit","Peanut Butter Toast",
  "Chicken Caesar Salad","Fish & Quinoa","Tofu Stir Fry","Poke Bowl","Veg Burrito","Smoothie Bowl",
  "Chicken & Sweet Potato","Beef Chili","Sushi Rolls","Grilled Veg Sandwich","Muesli & Milk",
  "Egg & Spinach Wrap","Steak & Veggies","Chickpea Salad","Protein Pancakes","Soba Noodles",
  "Tofu Scramble","Veggie Burger","Baked Potato & Salmon","Hummus & Veg Platter","Mango Chicken",
  "Black Bean Tacos","Couscous Salad","Granola & Yogurt","Prawn Stir Fry","Zucchini Noodles",
  "Chicken & Avocado Salad","Falafel Bowl","Rice & Beans","Cauliflower Curry","Lentil & Quinoa Salad"
];

const INTENSITIES = ["light","moderate","high"];
const TYPES = ["cardio","strength","core","mobility","balance"];

// ------------------------- realistic generators -------------------------
function generateExerciseInstance(name) {
  const type = randomChoice(TYPES);
  const intensity = randomChoice(INTENSITIES);

  // Determine sets/reps/duration by type
  let sets = randomBetween(1, 5);
  let reps;
  let duration_min;

  if (type === "strength") {
    reps = randomBetween(6, 15);            // strength reps
    duration_min = randomBetween(5, 20);
    sets = randomBetween(2, 5);
  } else if (type === "cardio") {
    reps = randomBetween(10, 40);
    duration_min = randomBetween(10, 40);
    sets = 1;
  } else if (type === "core") {
    reps = randomBetween(8, 25);
    duration_min = randomBetween(4, 15);
    sets = randomBetween(1, 4);
  } else if (type === "mobility") {
    reps = randomBetween(8, 20);
    duration_min = randomBetween(5, 20);
    sets = randomBetween(1, 3);
  } else { // balance
    reps = randomBetween(6, 20);
    duration_min = randomBetween(4, 15);
    sets = randomBetween(1, 3);
  }

  // calories burned estimate: keep within 30-600
  const intensityMult = intensity === "high" ? 1.3 : intensity === "moderate" ? 1.0 : 0.75;
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
    description: `${name} — ${intensity} ${type} exercise`
  };
}

function generateMealInstance(name) {
  // set macros to reasonable ranges:
  // protein: 10-60g, carbs: 15-120g, fats: 5-40g
  let protein = randomBetween(10, 60);
  let carbs = randomBetween(15, 120);
  let fats = randomBetween(5, 40);

  // compute calories from macros
  let calories = protein * 4 + carbs * 4 + fats * 9;

  // clamp calories to 200-800 by scaling macros proportionally if needed
  if (calories < 200) {
    const scale = 200 / Math.max(1, calories);
    protein = Math.max(10, Math.round(protein * scale));
    carbs = Math.max(15, Math.round(carbs * scale));
    fats = Math.max(5, Math.round(fats * scale));
    calories = protein * 4 + carbs * 4 + fats * 9;
  } else if (calories > 800) {
    const scale = 800 / calories;
    protein = Math.max(10, Math.round(protein * scale));
    carbs = Math.max(15, Math.round(carbs * scale));
    fats = Math.max(5, Math.round(fats * scale));
    calories = protein * 4 + carbs * 4 + fats * 9;
  }

  // ensure integer calories
  calories = Math.round(calories);

  return {
    name,
    description: `${name} — balanced meal`,
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
app.get("/", (req, res) => {
  res.send("✅ AI Diet Planner — realistic random backend (meals & workouts)");
});

// profile endpoint (returns last profile or default)
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

// generate-plan: accepts profile but selection is random; returns full plan
app.post("/api/generate-plan", (req, res) => {
  const body = req.body || {};
  const profile = {
    age: body.age || 28,
    weight: body.weight || 70,
    height: body.height || 175,
    gender: body.gender || "male",
    goal: body.goal || "maintain",
    activityLevel: body.activityLevel || "moderate"
  };

  // choose 6 exercises and 3 meals
  const chosenExerciseNames = chooseRandom(EXERCISE_NAMES, 6);
  const chosenMealNames = chooseRandom(MEAL_NAMES, 3);

  const exercises = chosenExerciseNames.map(name => generateExerciseInstance(name));
  const meals = chosenMealNames.map(name => generateMealInstance(name));

  LAST_PLAN = {
    profile,
    workout_plan: { exercises },
    meal_plan: { meals },
    generated_at: new Date().toISOString()
  };

  return res.json({
    message: "Random plan generated",
    profile: LAST_PLAN.profile,
    workout_plan: LAST_PLAN.workout_plan,
    meal_plan: LAST_PLAN.meal_plan,
    generated_at: LAST_PLAN.generated_at
  });
});

// get last workout plan (or fallback random)
app.get("/api/workout-plan", (req, res) => {
  if (LAST_PLAN.workout_plan) return res.json(LAST_PLAN.workout_plan);
  // fallback: return fresh random set
  const fallback = chooseRandom(EXERCISE_NAMES, 6).map(name => generateExerciseInstance(name));
  return res.json({ exercises: fallback });
});

// get last meal plan (or fallback random)
app.get("/api/meal-plan", (req, res) => {
  if (LAST_PLAN.meal_plan) return res.json(LAST_PLAN.meal_plan);
  const fallback = chooseRandom(MEAL_NAMES, 3).map(name => generateMealInstance(name));
  return res.json({ meals: fallback });
});

// ------------------------- start server -------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`💪 Exercise templates: ${EXERCISE_NAMES.length}, Meal templates: ${MEAL_NAMES.length}`);
});
