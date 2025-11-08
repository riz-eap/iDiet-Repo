// src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root') || document.body.appendChild(document.createElement('div'));
container.id = 'root';
const root = createRoot(container);

// Wrap in StrictMode to surface potential problems during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
