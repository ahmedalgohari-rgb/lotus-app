import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface TabItem {
  path: string;
  icon: string;
  label: {
    en: string;
    ar: string;
  };
}

const tabs: TabItem[] = [
  {
    path: '/',
    icon: '🏠',
    label: { en: 'Home', ar: 'الرئيسية' }
  },
  {
    path: '/plants',
    icon: '🌿',
    label: { en: 'Plants', ar: 'النباتات' }
  },
  {
    path: '/identify',
    icon: '📷',
    label: { en: 'Identify', ar: 'التشخيص' }
  },
  {
    path: '/care',
    icon: '🏥',
    label: { en: 'Care', ar: 'العناية' }
  },
  {
    path: '/profile',
    icon: '⚙️',
    label: { en: 'Profile', ar: 'الملف' }
  }
];

const BottomTabBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg touch-target transition-colors duration-200 ${
                isActive
                  ? 'text-lotus-green bg-lotus-green/10'
                  : 'text-gray-600 hover:text-lotus-green hover:bg-lotus-green/5'
              }`}
            >
              {/* Icon */}
              <span className="text-2xl mb-1 relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-lotus-green rounded-full"></span>
                )}
              </span>
              
              {/* Label */}
              <div className="text-center">
                <span className={`block text-xs font-medium ${isActive ? 'text-lotus-green' : 'text-gray-600'}`}>
                  {tab.label.en}
                </span>
                <span className={`block text-xs font-arabic arabic-text ${isActive ? 'text-lotus-green' : 'text-gray-500'}`}>
                  {tab.label.ar}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-bottom bg-white"></div>
    </nav>
  );
};

export default BottomTabBar;