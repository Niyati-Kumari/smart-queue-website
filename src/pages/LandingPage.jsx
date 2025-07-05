import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Import the CSS file

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <div className="landing-container">
        {/* Logo/Icon */}
        <div className="logo-section">
          <div className="logo-circle">⏱️</div>
          <h1 className="landing-title">Smart Queue</h1>
        </div>

        <p className="landing-subtitle">
          📲 Skip the lines. ⏳ Book smarter. 🔔 Stay updated in real-time.
        </p>

        <div className="button-group">
          <button onClick={() => navigate('/admin/login')} className="landing-btn red">
            🚀 Login as Admin
          </button>
          <button onClick={() => navigate('/customer/signup')} className="landing-btn green">
            ✍️ Sign Up as Customer
          </button>
          <button onClick={() => navigate('/customer/login')} className="landing-btn blue">
            🔐 Login as Customer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
