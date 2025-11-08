import React, {useEffect, useState, useCallback} from 'react';
const [meal, setMeal] = useState(null);
const [loadingWorkout, setLoadingWorkout] = useState(false);
const [loadingMeal, setLoadingMeal] = useState(false);
const [statusMessage, setStatusMessage] = useState('');


const fetchWorkout = useCallback(async ()=>{
setLoadingWorkout(true);
try{ const p = await api.workoutPlan(); setWorkout(p); }catch(e){ setStatusMessage('Error loading workout plan'); setWorkout(null);} finally{ setLoadingWorkout(false); }
},[]);


const fetchMeal = useCallback(async ()=>{
setLoadingMeal(true);
try{ const p = await api.mealPlan(); setMeal(p); }catch(e){ setStatusMessage('Error loading meal plan'); setMeal(null);} finally{ setLoadingMeal(false); }
},[]);


useEffect(()=>{ // initial fetch
(async ()=>{
await fetchWorkout();
await fetchMeal();
})();


function onGenerate(){ handleGenerate(); }
window.addEventListener('generate-plan', onGenerate);
return ()=> window.removeEventListener('generate-plan', onGenerate);
},[fetchMeal,fetchWorkout]);


async function handleGenerate(){
const local = localStorage.getItem('afp_profile');
const user = local ? JSON.parse(local) : {age:28,weight:70,height:175,gender:'male',goal:'lose_weight',activityLevel:'moderate'};
try{
setStatusMessage('Generating plan...');
await api.generatePlan(user);
setStatusMessage('Plan generated successfully');
await fetchWorkout();
await fetchMeal();
}catch(e){ setStatusMessage('Error generating plan. Check backend.'); }
}


function exportPlan(){
const blob = new Blob([JSON.stringify({workout,meal},null,2)],{type:'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = 'ai-fitness-plan.json'; a.click(); URL.revokeObjectURL(url);
}


return (
<div className="container">
<header className="header">
<h1>AI Fitness Planner</h1>
<p className="small">Your personalized diet and workout recommendation system</p>
</header>


<div className="demo-banner">Customize your profile and click "Generate Plan" to create your personalized workout and meal plan</div>


<div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'1rem',marginTop:'1rem'}}>
<div style={{display:'grid',gap:'0.7rem'}}>
<ProfileCard onProfileSaved={()=>setStatusMessage('Profile saved')} setStatusMessage={setStatusMessage} />
<ApiStatus />
<div className="card">
<div className="card-header"><h3>Quick Actions</h3></div>
<div style={{display:'flex',gap:'0.5rem'}}>
<button className="btn" onClick={async ()=>{ await fetchWorkout(); await fetchMeal(); setStatusMessage('Refreshed plans'); }}>Refresh Plans</button>
<button className="btn btn-success" onClick={exportPlan}>Download Plan</button>
</div>
</div>
{statusMessage && <div className="success-message" style={{marginTop:8}}>{statusMessage}</div>}
</div>


<div style={{display:'grid',gap:'0.7rem'}}>
{loadingWorkout ? <div className="card"><div className="placeholder">Loading workout... <Spinner/></div></div> : <WorkoutPlan plan={workout} />}
{loadingMeal ? <div className="card"><div className="placeholder">Loading meal... <Spinner/></div></div> : <MealPlan plan={meal} />}
</div>
</div>


<footer className="footer">AI Fitness Planner Demo • Backend: Node.js + Express • Frontend: React</footer>
</div>
)
}
