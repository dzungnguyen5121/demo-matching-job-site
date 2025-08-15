import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('seeker' | 'poster')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to a default page based on their role if they try to access a forbidden page
    const redirectTo = user.role === 'seeker' ? '/seeker/find' : '/poster/jobs';
    return <Navigate to={redirectTo} />;
  }

  return children;
};

export default ProtectedRoute;
