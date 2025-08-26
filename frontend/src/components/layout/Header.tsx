import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/stores/authStore';

const Header: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return {
          en: 'My Garden',
          ar: 'حديقتي'
        };
      case '/plants':
        return {
          en: 'My Plants',
          ar: 'نباتاتي'
        };
      case '/care':
        return {
          en: 'Care Log',
          ar: 'سجل العناية'
        };
      case '/identify':
        return {
          en: 'Plant Doctor',
          ar: 'طبيب النباتات'
        };
      case '/profile':
        return {
          en: 'Profile',
          ar: 'الملف الشخصي'
        };
      default:
        return {
          en: 'Lotus',
          ar: 'لوتس'
        };
    }
  };

  const title = getPageTitle();
  const isHome = location.pathname === '/';

  return (
    <header className="bg-hero-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center">
            {!isHome && (
              <button 
                onClick={() => window.history.back()}
                className="mr-3 p-2 hover:bg-white/10 rounded-full touch-target"
                aria-label="Go back"
              >
                <svg className="w-6 h-6 rtl-flip" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div>
              <h1 className="text-h1 font-bold">
                {isHome && '🌿 '}{title.en}
              </h1>
              <p className="text-sm font-arabic arabic-text opacity-90">
                {title.ar}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="p-2 hover:bg-white/10 rounded-full touch-target relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 17h5l-5-5h0l5-5v10zm-10-5l-5-5v10l5-5zm5-10v20" />
              </svg>
              {/* Notification dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-needs-attention rounded-full"></span>
            </button>

            {/* Profile */}
            <Link 
              to="/profile"
              className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg touch-target"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  {user?.firstName?.[0]?.toUpperCase() || '👤'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs opacity-75">
                  {user?.email}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;