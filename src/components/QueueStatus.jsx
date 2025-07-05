import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import './QueueStatus.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const QueueStatus = () => {
  const [queue, setQueue] = useState([]);
  const previousFirstUserRef = useRef(null);

  useEffect(() => {
    const queueRef = ref(db, 'queue');

    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val() || {};

      const queueArray = Object.entries(data)
        .map(([id, entry]) => ({ id, ...entry }))
        .filter(user => !['removed', 'completed', 'skipped'].includes(user.status || ''))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const currentFirstUser = queueArray[0];
      const previousFirstUser = previousFirstUserRef.current;

      if (
        currentFirstUser &&
        (!previousFirstUser || previousFirstUser.uid !== currentFirstUser.uid)
      ) {
        // ✅ Notify backend of first user
        fetch(`${API_BASE_URL}/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentFirstUser.uid,
            name: currentFirstUser.name,
            email: currentFirstUser.email,
          }),
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to notify backend');
            console.log('📲 Push notification triggered');
          })
          .catch(console.error);

        previousFirstUserRef.current = currentFirstUser;
      }

      setQueue(queueArray);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="queue-status fade-in">
      <h2 className="queue-title">Live Queue Status</h2>

      {queue.length > 0 ? (
        <div className="predicted-container mb-6">
          <strong>🎯 Now Serving:</strong> {queue[0].name} ({queue[0].email || 'N/A'})
          {queue[0].order && (
            <div className="text-sm text-gray-700 mt-1">📦 Order: {queue[0].order}</div>
          )}
        </div>
      ) : (
        <div className="loading mb-6">No one is currently in the queue.</div>
      )}

      <div className="queue-list">
        {queue.map((user, index) => (
          <div key={user.id} className="queue-item fade-in">
            <strong>
              {index + 1}. {user.name} ({user.email || 'N/A'})
            </strong>
            <div className="text-sm text-gray-600">
              ⏱ Joined: {new Date(user.timestamp).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
              })}
            </div>
            {user.order && (
              <div className="text-sm text-gray-600 mt-1">📦 Order: {user.order}</div>
            )}
            <div className="text-sm text-gray-600 mt-1">
              Estimated Wait: <WaitTime index={index} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WaitTime = ({ index }) => {
  const [totalTime, setTotalTime] = useState(null);

  useEffect(() => {
    const fetchTotalTime = async () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.toLocaleString('en-US', { weekday: 'long' });
      const isWeekend = now.getDay() === 0 || now.getDay() === 6 ? 1 : 0;

      if (index === 0) {
        setTotalTime('0.0');
        return;
      }

      try {
        const predictions = await Promise.all(
          [...Array(index).keys()].map(async (i) => {
            const res = await fetch(
              `${API_BASE_URL}/predict?hour=${hour}&day=${day}&weekend=${isWeekend}&festival=0&queue=${i + 1}`
            );
            const data = await res.json();
            const wait = parseFloat(data.predicted_wait_time);
            return isNaN(wait) ? 0 : wait;
          })
        );

        const total = predictions.reduce((sum, val) => sum + val, 0);
        setTotalTime(total.toFixed(1));
      } catch (err) {
        console.error('Prediction error:', err);
        setTotalTime('Unavailable');
      }
    };

    fetchTotalTime();
  }, [index]);

  return <span>{totalTime !== null ? `${totalTime} min` : '...'}</span>;
};

export default QueueStatus;

