// src/components/ProfileCard.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * ProfileCard
 * Props:
 * - onProfileSaved: function(profile) => void
 * - setStatusMessage: function(message) => void
 */
export default function ProfileCard({ onProfileSaved, setStatusMessage }) {
  const [profile, setProfile] = useState({
    age: 28,
    weight: 70,
    height: 175,
    gender: 'male',
    goal: 'lose_weight',
    activityLevel: 'moderate'
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load profile from localStorage and backend (if available) on mount
  useEffect(() => {
    let mounted = true;

    // Load from localStorage first (so UI is snappy)
    try {
      const local = localStorage.getItem('afp_profile');
      if (local) {
        const parsed = JSON.parse(local);
        if (mounted) setProfile(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Could not parse local profile', e);
    }

    // Try to fetch from backend and merge
    (async () => {
      setLoading(true);
      try {
        const p = await api.profile();
        if (p && mounted) {
          // Merge backend profile with local one (backend overrides)
          setProfile(prev => {
            const merged = { ...prev, ...p };
            try { localStorage.setItem('afp_profile', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      } catch (err) {
        // silent fail — backend may be unreachable; keep local profile
        // console.error('Profile fetch error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function toggleEdit() {
    setEditMode(!editMode);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    // keep numeric values numeric where appropriate
    const newValue = (name === 'age' || name === 'weight' || name === 'height') ? Number(value) : value;
    setProfile(p => ({ ...p, [name]: newValue }));
  }

  function saveProfile() {
    try {
      localStorage.setItem('afp_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save profile to localStorage', e);
    }
    setEditMode(false);
    setStatusMessage && setStatusMessage('Profile updated');
    onProfileSaved && onProfileSaved(profile);
  }

  function generatePlan() {
    const e = new Event('generate-plan');
    window.dispatchEvent(e);
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>User Profile</h3>
        <button className="btn" onClick={toggleEdit}>
          {editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {loading ? (
        <div className="placeholder">Loading profile...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label className="small">Age</label>
            <input
              name="age"
              value={profile.age}
              onChange={handleChange}
              disabled={!editMode}
              className="input"
              type="number"
              min={15}
              max={100}
            />
          </div>

          <div>
            <label className="small">Weight (kg)</label>
            <input
              name="weight"
              value={profile.weight}
              onChange={handleChange}
              disabled={!editMode}
              className="input"
              type="number"
              step="0.1"
            />
          </div>

          <div>
            <label className="small">Height (cm)</label>
            <input
              name="height"
              value={profile.height}
              onChange={handleChange}
              disabled={!editMode}
              className="input"
              type="number"
            />
          </div>

          <div>
            <label className="small">Gender</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              disabled={!editMode}
              className="input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="small">Goal</label>
            <select
              name="goal"
              value={profile.goal}
              onChange={handleChange}
              disabled={!editMode}
              className="input"
            >
              <option value="lose_weight">Lose Weight</option>
              <option value="build_muscle">Build Muscle</option>
              <option value="maintain">Maintain Weight</option>
              <option value="improve_endurance">Improve Endurance</option>
              <option value="get_toned">Get Toned</option>
            </select>
          </div>

          <div>
            <label className="small">Activity Level</label>
            <select
              name="activityLevel"
              value={profile.activityLevel}
              onChange={handleChange}
              disabled={!editMode}
              className="input"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light (1–3 days/week)</option>
              <option value="moderate">Moderate (3–5 days/week)</option>
              <option value="active">Active (6–7 days/week)</option>
              <option value="very_active">Very Active (daily)</option>
            </select>
          </div>
        </div>
      )}

      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
        {editMode && (
          <button className="btn btn-success" onClick={saveProfile}>
            Save Changes
          </button>
        )}

        <button className="btn btn-accent" onClick={generatePlan}>
          Generate Plan
        </button>
      </div>
    </div>
  );
}
