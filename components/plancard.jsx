import React from 'react';


export function WorkoutPlan({plan}){
if(!plan) return (<div className="card"><div className="placeholder"><div style={{fontSize:'2rem'}}>💪</div><p>Your personalized workout plan will appear here</p></div></div>);
return (
<div className="card">
<div className="card-header"><h3>Today's Workout Plan</h3></div>
<div>
<h4>{plan.name}</h4>
{plan.exercises.map((ex,i)=> (
<div key={i} style={{marginBottom:'0.6rem',padding:'0.6rem',background:'var(--light)',borderRadius:8}}>
<strong>{ex.name}</strong>
<p className="small" style={{margin:'0.3rem 0'}}>{ex.description}</p>
<div className="stats">
{ex.sets && <span className="stat">{ex.sets} sets</span>}
{ex.reps && <span className="stat">{ex.reps} reps</span>}
{ex.duration && <span className="stat">{ex.duration} sec</span>}
<span className="stat">{ex.type}</span>
</div>
</div>
))}
</div>
</div>
)
}


export function MealPlan({plan}){
if(!plan) return (<div className="card"><div className="placeholder"><div style={{fontSize:'2rem'}}>🍎</div><p>Your personalized meal plan will appear here</p></div></div>);
return (
<div className="card">
<div className="card-header"><h3>Today's Meal Plan</h3></div>
<div>
<p><strong>Daily Calories:</strong> {plan.daily_calories} kcal</p>
{plan.meals.map((meal,i)=> (
<div key={i} style={{marginBottom:'0.6rem',padding:'0.6rem',background:'var(--light)',borderRadius:8}}>
<strong>{meal.name}</strong>
<p className="small" style={{margin:'0.3rem 0'}}>{meal.description}</p>
<div className="stats">
<span className="stat">{meal.calories} kcal</span>
<span className="stat">{meal.protein}g protein</span>
<span className="stat">{meal.carbs}g carbs</span>
<span className="stat">{meal.fats}g fats</span>
</div>
</div>
))}
</div>
</div>
)
}
