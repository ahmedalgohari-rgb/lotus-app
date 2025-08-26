import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  actionText?: string;
  actionTextAr?: string;
  actionLink?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  titleAr,
  description,
  descriptionAr,
  actionText,
  actionTextAr,
  actionLink,
  onAction,
}) => {
  const ActionComponent = actionLink ? Link : 'button';
  const actionProps = actionLink ? { to: actionLink } : { onClick: onAction };

  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      <div className="text-6xl mb-4 animate-pulse-slow">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-h2 text-gray-900 mb-2">
        {title}
      </h3>
      {titleAr && (
        <h3 className="text-h2 font-arabic arabic-text text-gray-800 mb-4">
          {titleAr}
        </h3>
      )}
      
      {/* Description */}
      <p className="text-body text-gray-600 mb-2">
        {description}
      </p>
      {descriptionAr && (
        <p className="text-body font-arabic arabic-text text-gray-500 mb-6">
          {descriptionAr}
        </p>
      )}
      
      {/* Action Button */}
      {(actionText || actionTextAr) && (
        <ActionComponent
          {...actionProps}
          className="btn-primary inline-block"
        >
          <span>
            {actionText}
            {actionTextAr && (
              <span className="block text-sm font-arabic arabic-text mt-1">
                {actionTextAr}
              </span>
            )}
          </span>
        </ActionComponent>
      )}
    </div>
  );
};

export default EmptyState;