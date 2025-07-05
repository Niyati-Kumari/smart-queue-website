import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue, update, set } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-queue-website.onrender.com';

const formatISTTime = (timestamp) =>
  new Date(timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

const AdminDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [editing, setEditing] = useState({});
  const [filter, setFilter] = useState('all');
  const [servedCount, setServedCount] = useState(0);
  const [search, setSearch] = useState('');

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const queueRef = ref(db, 'queue');

    onValue(queueRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data)
        .map(([key, value]) => ({ key, ...value }))
        .filter(user => user.status !== 'removed' && user.status !== 'completed')
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setQueue(list);
    });
  }, []);

  // ✅ Correct served count by filter
  useEffect(() => {
    const historyRef = ref(db, 'history');

    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      let count = 0;

      Object.values(data).forEach(userRecords => {
        Object.values(userRecords).forEach(entry => {
          const completedDate = new Date(entry.timestamp);

          if (filter === 'today') {
            if (completedDate.toDateString() === now.toDateString()) {
              count++;
            }
          } else if (filter === 'week') {
            if (completedDate >= weekAgo && completedDate <= now) {
              count++;
            }
          } else {
            count++;
          }
        });
      });

      setServedCount(count);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleAddToken = async () => {
    if (!newName.trim() || !newEmail.trim()) return alert('Please enter name and email.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return alert('Invalid email format.');

    const alreadyInQueue = queue.some(user => user.email === newEmail);
    if (alreadyInQueue) return alert('User already in queue.');

    const timestamp = new Date().toISOString();
    await set(ref(db, `queue/${Date.now()}`), {
      name: newName.trim(),
      email: newEmail.trim(),
      timestamp,
      status: 'waiting',
      order: newOrder.trim() || '',
    });

    setNewName('');
    setNewEmail('');
    setNewOrder('');
  };

  const handleEditToggle = (key) => {
    setEditing(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEditChange = (key, field, value) => {
    update(ref(db, `queue/${key}`), { [field]: value });
  };

  const handleRemove = async (user) => {
    await update(ref(db, `queue/${user.key}`), { status: 'removed' });
  };

  const handleMarkCompleted = async (user) => {
    const completedAt = Date.now(); // ✅ Use timestamp in milliseconds

    await update(ref(db, `queue/${user.key}`), {
      status: 'completed',
      rating: null,
    });

    await set(ref(db, `history/${user.key}/${completedAt}`), {
      name: user.name,
      timestamp: completedAt,
      status: 'completed',
      service: 'Admin Token',
      rating: null,
      order: user.order || '',
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const getFilteredQueue = () => {
    const now = new Date();
    return queue
      .filter(user => {
        const date = new Date(user.timestamp);
        if (filter === 'today') {
          return date.toDateString() === now.toDateString();
        } else if (filter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo && date <= now;
        }
        return true;
      })
      .filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Logged in as <strong>{currentUser?.email}</strong></p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
      </header>

      {/* Add Token */}
      <section className="admin-card">
        <h2 className="section-title">➕ Add New Token</h2>
        <div className="token-inputs">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" />
          <input value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="Order (optional)" />
          <button className="add-btn" onClick={handleAddToken}>Add</button>
        </div>
      </section>

      {/* Filters */}
      <section className="admin-filters">
        <div className="filters-left">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </div>
        <div className="filters-right">
          📊 Served: <strong>{servedCount}</strong>
        </div>
      </section>

      {/* Active Queue */}
      <section className="admin-card">
        <h2 className="section-title">🟢 Active Queue</h2>
        {getFilteredQueue().length === 0 ? (
          <p className="no-data">No active users.</p>
        ) : (
          getFilteredQueue().map((user, index) => (
            <div key={user.key} className="queue-row">
              <div className="user-info">
                <h3>{index + 1}. {user.name}</h3>
                <p>{user.email}</p>
                <p>🕒 {formatISTTime(user.timestamp)}</p>
                <p>📦 {user.order || 'No order'}</p>
                <p>⏳ Estimated Wait: <AdminWaitTime index={index} /></p>
              </div>

              <div className="admin-actions">
                <button onClick={() => handleEditToggle(user.key)} className="edit-btn">
                  {editing[user.key] ? 'Save' : '✏️ Edit'}
                </button>
                {editing[user.key] && (
                  <>
                    <input
                      defaultValue={user.name}
                      onBlur={(e) => handleEditChange(user.key, 'name', e.target.value)}
                      placeholder="Edit name"
                    />
                    <input
                      defaultValue={user.order}
                      onBlur={(e) => handleEditChange(user.key, 'order', e.target.value)}
                      placeholder="Edit order"
                    />
                  </>
                )}
                <button onClick={() => handleMarkCompleted(user)} className="complete-btn">Served</button>
                <button onClick={() => handleRemove(user)} className="remove-btn">Remove</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

const AdminWaitTime = ({ index }) => {
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

export default AdminDashboard;
