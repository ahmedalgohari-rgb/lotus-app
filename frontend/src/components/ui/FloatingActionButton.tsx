import React from 'react';
import { useNavigate } from 'react-router-dom';

const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/plants/add');
  };

  return (
    <button
      onClick={handleClick}
      className="fab"
      aria-label="Add new plant / إضافة نبات جديد"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
};

export default FloatingActionButton;