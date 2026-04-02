import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const ProtectedRoute = ({ children, allowedUserTypes, requiredPermission }) => {
  const { isAuthenticated, userType, hasPermission, loading } = useAuth();

  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    return <Navigate to={`/${userType}/dashboard`} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={`/${userType}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;
