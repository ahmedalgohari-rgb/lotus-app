import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cairo-sand">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lotus-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lotus-green font-medium">جاري التحميل... Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;