import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import './PredictedWaitTime.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PredictedWaitTime = () => {
  const [waitTime, setWaitTime] = useState(null);
  const [user, setUser] = useState(null);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const queueRef = ref(db, 'queue');

    const unsubscribe = onValue(queueRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const queueArray = Object.entries(data)
        .map(([id, entry]) => ({ id, ...entry }))
        .filter((entry) => !['removed', 'completed', 'skipped'].includes(entry.status || ''))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const index = queueArray.findIndex((item) => item.uid === user.uid);

      if (index === -1) {
        setWaitTime(null);
        setPosition(null);
        setLoading(false);
        return;
      }

      setPosition(index + 1);

      const now = new Date();
      const hour = now.getHours();
      const day = now.toLocaleString('en-US', { weekday: 'long' });
      const isWeekend = now.getDay() === 0 || now.getDay() === 6 ? 1 : 0;

      if (index === 0) {
        setWaitTime('0.0');
      } else {
        try {
          const waitTimes = await Promise.all(
            [...Array(index).keys()].map(async (i) => {
              const res = await fetch(
                `${API_BASE_URL}/predict?hour=${hour}&day=${day}&weekend=${isWeekend}&festival=0&queue=${i + 1}`
              );
              const data = await res.json();
              const wait = parseFloat(data.predicted_wait_time);
              return isNaN(wait) ? 0 : wait;
            })
          );

          const total = waitTimes.reduce((sum, val) => sum + val, 0);
          setWaitTime(total.toFixed(1));
        } catch (err) {
          console.error('Prediction fetch failed:', err);
          setWaitTime('Unavailable');
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="predicted-container fade-in">
      <h2 className="predicted-title">⏳ Predicted Wait Time</h2>

      {loading ? (
        <p className="predicted-message animate-pulse">🔄 Calculating your wait time...</p>
      ) : position !== null && waitTime !== null ? (
        <div className="space-y-2">
          <p className="predicted-position">
            You are currently at <span className="font-bold">position #{position}</span>.
          </p>
          <p className="predicted-wait">
            Estimated wait time: {waitTime} minutes.
          </p>
        </div>
      ) : (
        <p className="predicted-message">You are not currently in the queue.</p>
      )}
    </div>
  );
};

export default PredictedWaitTime;
