// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import ProfileCard from './components/ProfileCard';
import ApiStatus from './components/ApiStatus';
import { WorkoutPlan, MealPlan } from './components/PlanCard';
import Spinner from './components/Spinner';
import { api } from './services/api';
import Login from './components/Login';

/**
 * Top-level App
 * - Shows login screen if not authenticated
 * - Otherwise, shows the dashboard and plan UI
 */
export default function App() {
  // Auth state: user object and token presence
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('afp_user') || 'null');
    } catch {
      return null;
    }
  });

  // Plans & UI state
  const [workout, setWorkout] = useState(null);
  const [meal, setMeal] = useState(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetchers
  const fetchWorkout = useCallback(async () => {
    setLoadingWorkout(true);
    try {
      const p = await api.workoutPlan();
      setWorkout(p);
    } catch (e) {
      console.error('fetchWorkout error', e);
      setStatusMessage('Error loading workout plan');
      setWorkout(null);
    } finally {
      setLoadingWorkout(false);
    }
  }, []);

  const fetchMeal = useCallback(async () => {
    setLoadingMeal(true);
    try {
      const p = await api.mealPlan();
      setMeal(p);
    } catch (e) {
      console.error('fetchMeal error', e);
      setStatusMessage('Error loading meal plan');
      setMeal(null);
    } finally {
      setLoadingMeal(false);
    }
  }, []);

  // Initialize and add event listener for generate-plan
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await fetchWorkout();
      await fetchMeal();
    })();

    function onGenerate() {
      handleGenerate();
    }
    window.addEventListener('generate-plan', onGenerate);
    return () => {
      mounted = false;
      window.removeEventListener('generate-plan', onGenerate);
    };
  }, [fetchMeal, fetchWorkout]);

  // Generate plan (sends profile to backend, then refreshes display)
  async function handleGenerate() {
    const local = localStorage.getItem('afp_profile');
    const profile = local
      ? JSON.parse(local)
      : { age: 28, weight: 70, height: 175, gender: 'male', goal: 'lose_weight', activityLevel: 'moderate' };

    try {
      setStatusMessage('Generating plan...');
      await api.generatePlan(profile);
      setStatusMessage('Plan generated successfully');
      await fetchWorkout();
      await fetchMeal();
    } catch (e) {
      console.error('handleGenerate error', e);
      setStatusMessage('Error generating plan. Check backend.');
    }
  }

  // Export combined plan as JSON
  function exportPlan() {
    const blob = new Blob([JSON.stringify({ workout, meal }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-fitness-plan.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Login handler (called by Login component)
  async function handleLogin(userObj) {
    // userObj comes from Login.jsx which stores token + user to localStorage;
    // we just sync local state here
    try {
      setUser(userObj);
      setStatusMessage('Signed in');
      // Refresh plans (authenticated)
      await fetchWorkout();
      await fetchMeal();
    } catch (e) {
      console.error('handleLogin error', e);
    }
  }

  // Logout handler
  function logout() {
    localStorage.removeItem('afp_token');
    localStorage.removeItem('afp_user');
    setUser(null);
    setStatusMessage('Signed out');
  }

  // If not authenticated, show Login
  if (!user) {
    return (
      <div className="container">
        <header className="header">
          <h1>AI Fitness Planner</h1>
          <p className="small">Sign in to access your personalized plans</p>
        </header>

        <div style={{ maxWidth: 520, margin: '0 auto', marginTop: 24 }}>
          <Login onLogin={async (u) => {
            // Login component stores token and user in localStorage; here we read it back
            try {
              const storedUser = JSON.parse(localStorage.getItem('afp_user') || 'null');
              handleLogin(storedUser || u);
            } catch {
              handleLogin(u);
            }
          }} />
        </div>

        <footer className="footer">AI Fitness Planner Demo • Backend: Node.js + Express • Frontend: React</footer>
      </div>
    );
  }

  // Authenticated UI
  return (
    <div className="container">
      <header className="header">
        <h1>AI Fitness Planner</h1>
        <p className="small">Your personalized diet and workout recommendation system</p>
      </header>

      <div className="demo-banner">Customize your profile and click "Generate Plan" to create your personalized workout and meal plan</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.7rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Welcome, {user.name || user.email}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>

          <ProfileCard onProfileSaved={() => setStatusMessage('Profile saved')} setStatusMessage={setStatusMessage} />
          <ApiStatus />

          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn"
                onClick={async () => {
                  setStatusMessage('Refreshing plans...');
                  await fetchWorkout();
                  await fetchMeal();
                  setStatusMessage('Refreshed plans');
                }}
              >
                Refresh Plans
              </button>
              <button className="btn btn-success" onClick={exportPlan}>Download Plan</button>
            </div>
          </div>

          {statusMessage && <div className="success-message" style={{ marginTop: 8 }}>{statusMessage}</div>}
        </div>

        <div style={{ display: 'grid', gap: '0.7rem' }}>
          {loadingWorkout ? (
            <div className="card"><div className="placeholder">Loading workout... <Spinner /></div></div>
          ) : (
            <WorkoutPlan plan={workout} />
          )}

          {loadingMeal ? (
            <div className="card"><div className="placeholder">Loading meal... <Spinner /></div></div>
          ) : (
            <MealPlan plan={meal} />
          )}
        </div>
      </div>

      <footer className="footer">AI Fitness Planner Demo • Backend: Node.js + Express • Frontend: React</footer>
    </div>
  );
}
