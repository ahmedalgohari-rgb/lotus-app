import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton ${className}`}>
      <div className="w-full h-full"></div>
    </div>
  );
};

export default LoadingSkeleton;