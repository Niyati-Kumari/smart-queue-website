import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingRole, setCheckingRole] = useState(false);
  const navigate = useNavigate();

  const { login, currentUser, role } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCheckingRole(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      setCheckingRole(false);
    }
  };

  useEffect(() => {
    if (currentUser && role) {
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Access denied: You are not an admin.');
      }
      setCheckingRole(false);
    }
  }, [currentUser, role, navigate]);

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card animate-fade-in">
        <div className="admin-logo-circle">🛡️</div>
        <h2 className="admin-title">Admin Login</h2>

        {error && <p className="admin-error">{error}</p>}

        <form onSubmit={handleSubmit} className="admin-form">
          <input
            type="email"
            placeholder="Admin Email"
            className="admin-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <input
            type="password"
            placeholder="Password"
            className="admin-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={checkingRole}
            className={`admin-button ${checkingRole ? 'disabled' : ''}`}
          >
            {checkingRole ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
