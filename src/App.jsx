import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

import CustomerSignup from './pages/CustomerSignup';
import CustomerLogin from './pages/CustomerLogin';
import CustomerDashboard from './pages/CustomerDashboard';

import LandingPage from './pages/LandingPage';

import { useAuth } from './context/AuthContext';

// ProtectedRoute wrapper to guard role-specific routes
function ProtectedRoute({ children, role }) {
  const { currentUser, role: userRole } = useAuth();

  if (currentUser === undefined) {
    // Auth still loading
    return null;
  }

  if (!currentUser) {
    // Not logged in → redirect to respective login
    return <Navigate to={role === 'admin' ? '/admin/login' : '/customer/login'} replace />;
  }

  if (role && userRole !== role) {
    // Logged in but wrong role → redirect to landing
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 🏠 Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* 👥 Customer */}
        <Route path="/customer/signup" element={<CustomerSignup />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* 🔐 Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 🚫 Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
