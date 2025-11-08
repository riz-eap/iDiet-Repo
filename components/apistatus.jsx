import React, {useEffect, useState} from 'react';
import { api } from '../services/api';


export default function ApiStatus(){
const [status, setStatus] = useState({backend:'Checking...', endpoints:'Checking...', color:'gray'});


useEffect(()=>{ check(); const id = setInterval(check, 10000); return ()=>clearInterval(id); },[]);


async function check(){
const h = await api.health();
if(!h.ok){ setStatus({backend:'Offline', endpoints:'Cannot check endpoints', color:'red'}); return; }
let available = 0; const endpoints = ['/api/profile','/api/workout-plan','/api/meal-plan'];
for(const ep of endpoints){ try{ const r = await fetch(`${apiBaseUrlPlaceholder()}${ep}`); if(r.ok) available++; }catch{} }
const color = available === endpoints.length ? 'green' : 'orange';
setStatus({backend:'Online (Connected)', endpoints:`${available}/${endpoints.length} available`, color});
}


function apiBaseUrlPlaceholder(){ // to avoid importing config here; it's a small helper
return (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000');
}


return (
<div className="card">
<div className="card-header"><h3>API Status</h3></div>
<div style={{display:'grid',gap:'0.5rem'}}>
<div><strong>Backend:</strong> <span style={{color:status.color}}> {status.backend}</span></div>
<div><strong>Endpoints:</strong> <span style={{color:status.color}}> {status.endpoints}</span></div>
</div>
</div>
)
}
