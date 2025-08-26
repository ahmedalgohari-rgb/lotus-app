import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-morning-mist flex flex-col">
      {/* Header */}
      <header className="pt-safe bg-hero-gradient text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-display font-bold mb-2">
              <span className="block text-2xl">🌿 Lotus</span>
              <span className="block text-lg font-arabic arabic-text">حديقتي الشخصية</span>
            </h1>
            <p className="text-body opacity-90">
              Your personal plant care companion
            </p>
            <p className="text-body opacity-90 font-arabic arabic-text">
              رفيق العناية بالنباتات المصرية
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-plant-card p-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-caption text-gray-500">
        <p>Made with ❤️ for Egyptian plant lovers</p>
        <p className="font-arabic arabic-text">صُنع بحب لمحبي النباتات المصرية</p>
      </footer>
    </div>
  );
};

export default AuthLayout;