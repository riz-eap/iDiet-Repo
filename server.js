// server.js
import express from 'express';
import cors from 'cors';
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://<your-github-username>.github.io', 'https://<your-frontend-host>']
}));
// For quick testing only (less secure):
// app.use(cors());


const app = express();
app.use(cors());
app.use(express.json());

// Sample in-memory data
let userProfile = {
  age: 28,
  weight: 70,
  height: 175,
  gender: 'male',
  goal: 'lose_weight',
  activityLevel: 'moderate'
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

// Routes
app.get('/', (req, res) => res.send('Backend online'));

app.get('/api/profile', (req, res) => res.json(userProfile));

app.get('/api/workout-plan', (req, res) => res.json(workoutPlan));

app.get('/api/meal-plan', (req, res) => res.json(mealPlan));

app.post('/api/generate-plan', (req, res) => {
  const { age, weight, height, gender, goal, activityLevel } = req.body;
  userProfile = { age, weight, height, gender, goal, activityLevel };
  // In a real system, generate AI-driven personalized plan here
  res.json({ message: 'Plan generated successfully' });
});

app.listen(8000, () => console.log('✅ Backend running on http://localhost:8000'));

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve React frontend
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route for React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

