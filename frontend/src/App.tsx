import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Components (will create these next)
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import HomePage from '@pages/HomePage';
import PlantsPage from '@pages/plants/PlantsPage';
import PlantDetailPage from '@pages/plants/PlantDetailPage';
import AddPlantPage from '@pages/plants/AddPlantPage';
import CareLogPage from '@pages/care/CareLogPage';
import IdentifyPage from '@pages/identify/IdentifyPage';
import ProfilePage from '@pages/ProfilePage';

// Layout Components
import AuthLayout from '@components/layout/AuthLayout';
import AppLayout from '@components/layout/AppLayout';
import ProtectedRoute from '@components/auth/ProtectedRoute';

function App() {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <div className="App min-h-screen bg-cairo-sand">
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route index element={<Navigate to="/auth/login" replace />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="plants" element={<PlantsPage />} />
          <Route path="plants/add" element={<AddPlantPage />} />
          <Route path="plants/:id" element={<PlantDetailPage />} />
          <Route path="care" element={<CareLogPage />} />
          <Route path="identify" element={<IdentifyPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;