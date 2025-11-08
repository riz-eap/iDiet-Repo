import React, { useState, useEffect } from 'react';
const local = localStorage.getItem('afp_profile');
if(local) setProfile(JSON.parse(local));
(async ()=>{
try{
setLoading(true);
const p = await api.profile();
setProfile(prev => ({...prev,...p}));
localStorage.setItem('afp_profile', JSON.stringify({...profile,...p}));
}catch(e){}
setLoading(false);
})();
},[]);


function toggleEdit(){ setEditMode(!editMode); }


function handleChange(e){ const {name,value} = e.target; setProfile(p=>({...p,[name]: value})); }


function saveProfile(){
localStorage.setItem('afp_profile', JSON.stringify(profile));
setEditMode(false);
setStatusMessage('Profile updated');
onProfileSaved && onProfileSaved(profile);
}


return (
<div className="card">
<div className="card-header">
<h3>User Profile</h3>
<button className="btn" onClick={toggleEdit}>{editMode ? 'Cancel' : 'Edit'}</button>
</div>
{loading ? <div className="placeholder">Loading profile...</div> : (
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
<div>
<label className="small">Age</label>
<input name="age" value={profile.age} onChange={handleChange} disabled={!editMode} className="input" type="number" min={15} max={100} />
</div>
<div>
<label className="small">Weight (kg)</label>
<input name="weight" value={profile.weight} onChange={handleChange} disabled={!editMode} className="input" type="number" step="0.1" />
</div>
<div>
<label className="small">Height (cm)</label>
<input name="height" value={profile.height} onChange={handleChange} disabled={!editMode} className="input" type="number" />
</div>
<div>
<label className="small">Gender</label>
<select name="gender" value={profile.gender} onChange={handleChange} disabled={!editMode} className="input">
<option value="male">Male</option>
<option value="female">Female</option>
<option value="other">Other</option>
</select>
</div>
<div>
<label className="small">Goal</label>
<select name="goal" value={profile.goal} onChange={handleChange} disabled={!editMode} className="input">
<option value="lose_weight">Lose Weight</option>
<option value="build_muscle">Build Muscle</option>
<option value="maintain">Maintain Weight</option>
<option value="improve_endurance">Improve Endurance</option>
<option value="get_toned">Get Toned</option>
</select>
</div>
<div>
<label className="small">Activity Level</label>
<select name="activityLevel" value={profile.activityLevel} onChange={handleChange} disabled={!editMode} className="input">
<option value="sedentary">Sedentary</option>
<option value="light">Light (1–3 days/week)</option>
<option value="moderate">Moderate (3–5 days/week)</option>
<option value="active">Active (6–7 days/week)</option>
<option value="very_active">Very Active (daily)</option>
</select>
</div>
</div>
)}


<div style={{marginTop:'0.8rem',display:'flex',gap:'0.5rem'}}>
{editMode && <button className="btn btn-success" onClick={saveProfile}>Save Changes</button>}
<button className="btn btn-accent" onClick={()=>{ const e = new Event('generate-plan'); window.dispatchEvent(e); }}>Generate Plan</button>
</div>
</div>
)
}
