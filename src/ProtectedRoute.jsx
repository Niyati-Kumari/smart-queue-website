import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { currentUser, role: userRole } = useAuth();
  const location = useLocation();

  // 🕒 Show loader while auth is determining status
  if (currentUser === undefined || userRole === null) {
    return (
      <div className="h-screen flex justify-center items-center">
        <p className="text-blue-600 font-medium text-lg">Checking authentication...</p>
      </div>
    );
  }

  // 🚫 Not logged in
  if (!currentUser) {
    const redirectPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/customer/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 🔒 Logged in but wrong role
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;


