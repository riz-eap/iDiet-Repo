import React from 'react';
export default function Spinner({size=32}){
return (
<div style={{display:'inline-block',width:size,height:size}} aria-hidden>
<svg viewBox="0 0 50 50" style={{width:'100%',height:'100%'}}>
<circle cx="25" cy="25" r="20" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
<path d="M45 25a20 20 0 00-6-14" stroke="var(--primary)" strokeWidth="4" fill="none" strokeLinecap="round"/>
</svg>
</div>
)
}
