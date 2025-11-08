// src/components/PlanCard.jsx
import React from 'react';

/**
 * Component: WorkoutPlan
 * Displays a list of exercises in the user's daily plan.
 */
export function WorkoutPlan({ plan }) {
  if (!plan || !plan.exercises || plan.exercises.length === 0) {
    return (
      <div className="card">
        <div className="placeholder">
          <div style={{ fontSize: '2rem' }}>💪</div>
          <p>Your personalized workout plan will appear here</p>
          <small>Click “Generate Plan” after updating your profile</small>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Today's Workout Plan</h3>
      </div>

      <div>
        {plan.name && <h4>{plan.name}</h4>}
        {plan.exercises.map((ex, i) => (
          <div
            key={i}
            style={{
              marginBottom: '0.6rem',
              padding: '0.6rem',
              background: 'var(--light)',
              borderRadius: 8
            }}
          >
            <strong>{ex.name || 'Exercise'}</strong>
            {ex.description && (
              <p className="small" style={{ margin: '0.3rem 0' }}>
                {ex.description}
              </p>
            )}
            <div className="stats">
              {ex.sets && <span className="stat">{ex.sets} sets</span>}
              {ex.reps && <span className="stat">{ex.reps} reps</span>}
              {ex.duration && <span className="stat">{ex.duration} sec</span>}
              {ex.type && <span className="stat">{ex.type}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Component: MealPlan
 * Displays meal details, total calories and macronutrient info.
 */
export function MealPlan({ plan }) {
  if (!plan || !plan.meals || plan.meals.length === 0) {
    return (
      <div className="card">
        <div className="placeholder">
          <div style={{ fontSize: '2rem' }}>🍎</div>
          <p>Your personalized meal plan will appear here</p>
          <small>Click “Generate Plan” after updating your profile</small>
        </div>
      </div>
    );
  }

  // Optional macro summary (if fields exist)
  const totalProtein = plan.meals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const totalCarbs = plan.meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalFats = plan.meals.reduce((acc, m) => acc + (m.fats || 0), 0);
  const totalCalories =
    plan.daily_calories ||
    plan.meals.reduce((acc, m) => acc + (m.calories || 0), 0);

  return (
    <div className="card">
      <div className="card-header">
        <h3>Today's Meal Plan</h3>
      </div>

      <div>
        <p>
          <strong>Daily Calories:</strong> {totalCalories.toFixed(0)} kcal
        </p>

        <div className="stats" style={{ marginBottom: '0.8rem' }}>
          <span className="stat">Protein: {totalProtein.toFixed(1)}g</span>
          <span className="stat">Carbs: {totalCarbs.toFixed(1)}g</span>
          <span className="stat">Fats: {totalFats.toFixed(1)}g</span>
        </div>

        {plan.meals.map((meal, i) => (
          <div
            key={i}
            style={{
              marginBottom: '0.6rem',
              padding: '0.6rem',
              background: 'var(--light)',
              borderRadius: 8
            }}
          >
            <strong>{meal.name || 'Meal'}</strong>
            {meal.description && (
              <p className="small" style={{ margin: '0.3rem 0' }}>
                {meal.description}
              </p>
            )}
            <div className="stats">
              {meal.calories && (
                <span className="stat">{meal.calories} kcal</span>
              )}
              {meal.protein && (
                <span className="stat">{meal.protein}g protein</span>
              )}
              {meal.carbs && (
                <span className="stat">{meal.carbs}g carbs</span>
              )}
              {meal.fats && <span className="stat">{meal.fats}g fats</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
