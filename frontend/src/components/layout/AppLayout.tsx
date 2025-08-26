import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomTabBar from './BottomTabBar';
import FloatingActionButton from '@components/ui/FloatingActionButton';

const AppLayout: React.FC = () => {
  const location = useLocation();

  // Determine if we should show the FAB based on current route
  const showFAB = ['/', '/plants'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-cairo-sand flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pb-16 overflow-auto">
        <Outlet />
      </main>

      {/* Floating Action Button */}
      {showFAB && <FloatingActionButton />}

      {/* Bottom Navigation */}
      <BottomTabBar />
    </div>
  );
};

export default AppLayout;