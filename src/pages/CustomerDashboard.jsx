import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

import QueueStatus from '../components/QueueStatus';
import VirtualToken from '../components/VirtualToken';
import PredictedWaitTime from '../components/PredictedWaitTime';

import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snapshot = await get(ref(db, `customers/${user.uid}`));
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        navigate('/customer/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Your Queue Dashboard</h1>

        {userData && (
          <div className="dashboard-content">
            <div className="welcome-box">
              <p className="welcome-name">👋 Welcome, {userData.name}</p>
              <p className="welcome-email">{userData.email}</p>
            </div>

            <div className="dashboard-grid">
              <VirtualToken />
              <PredictedWaitTime />
            </div>

            <QueueStatus />

            <button onClick={handleLogout} className="logout-button">
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
