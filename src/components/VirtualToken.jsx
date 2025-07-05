import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, push, remove, onValue, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import './VirtualToken.css';

const VirtualToken = () => {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [userTokenId, setUserTokenId] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [order, setOrder] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setQueue([]);
      setUserTokenId(null);
      setUserPosition(null);
      return;
    }

    const queueRef = ref(db, 'queue');
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val() || {};
      const activeQueue = Object.entries(data)
        .map(([id, entry]) => ({ id, ...entry }))
        .filter(item => !['removed', 'completed', 'skipped'].includes(item.status || ''))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setQueue(activeQueue);

      const userEntry = activeQueue.find(item => item.uid === user.uid);
      setUserTokenId(userEntry?.id || null);
      setUserPosition(userEntry ? activeQueue.findIndex(item => item.uid === user.uid) + 1 : null);
    });

    return () => unsubscribe();
  }, [user]);

  const handleToken = async () => {
    if (!user) return;

    if (userTokenId) {
      alert("❗ You already have a token in the queue.");
      return;
    }

    const userSnap = await get(ref(db, `customers/${user.uid}`));
    if (!userSnap.exists()) {
      alert('⚠️ User profile not found.');
      return;
    }

    const userData = userSnap.val();

    await push(ref(db, 'queue'), {
      uid: user.uid,
      name: userData.name,
      email: userData.email,
      timestamp: Date.now(),
      status: 'waiting',
      source: 'user',
      order: order.trim() || 'No order specified',
    });

    setOrder('');
  };

  const handleLeaveQueue = async () => {
    if (!userTokenId) return;
    const confirmLeave = window.confirm('Are you sure you want to leave the queue?');
    if (!confirmLeave) return;

    await remove(ref(db, `queue/${userTokenId}`));
    setUserTokenId(null);
    setUserPosition(null);
  };

  return (
    <div className="token-container fade-in">
      <h2 className="token-title">🎫 Book Your Token</h2>

      {!user ? (
        <p className="text-gray-500 italic">Please log in to join the queue.</p>
      ) : userTokenId ? (
        <div className="space-y-2">
          <p className="text-green-700 font-semibold">
            ✅ You are in the queue {userPosition ? `at position #${userPosition}` : ''}.
          </p>
          <button
            onClick={handleLeaveQueue}
            className="token-button bg-red-600 hover:bg-red-700 transition"
          >
            ❌ Leave Queue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={3}
            maxLength={200}
            placeholder="Describe your order here..."
            className="token-input resize-none"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <button
            onClick={handleToken}
            className="token-button bg-blue-600 hover:bg-blue-700 transition"
          >
            🚀 Get Token
          </button>
        </div>
      )}
    </div>
  );
};

export default VirtualToken;
