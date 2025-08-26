import React from 'react';
import { Link } from 'react-router-dom';
import type { Plant } from '@types/api';

interface PlantCardProps {
  plant: Plant;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  // Calculate days since last watering
  const getDaysSinceWatering = () => {
    if (!plant.lastWateredAt) return null;
    const lastWatered = new Date(plant.lastWateredAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastWatered.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine health status
  const getHealthStatus = () => {
    const daysSinceWatering = getDaysSinceWatering();
    const wateringFreq = plant.wateringFrequency || 7;
    
    if (!daysSinceWatering) {
      return { status: 'unknown', color: 'bg-gray-400', text: 'Unknown' };
    }
    
    if (daysSinceWatering <= wateringFreq) {
      return { status: 'healthy', color: 'bg-plant-healthy', text: 'Healthy' };
    } else if (daysSinceWatering <= wateringFreq + 2) {
      return { status: 'warning', color: 'bg-needs-attention', text: 'Needs Water' };
    } else {
      return { status: 'critical', color: 'bg-critical-care', text: 'Urgent Care' };
    }
  };

  // Parse location if it exists
  const getLocation = () => {
    try {
      return plant.location ? JSON.parse(plant.location) : null;
    } catch {
      return null;
    }
  };

  const daysSinceWatering = getDaysSinceWatering();
  const healthStatus = getHealthStatus();
  const location = getLocation();

  return (
    <Link 
      to={`/plants/${plant.id}`}
      className="plant-card block animate-slide-up hover:scale-105 transition-all duration-200"
    >
      {/* Plant Image */}
      <div className="relative h-32 bg-gradient-to-br from-lotus-green/10 to-nile-blue/10 flex items-center justify-center">
        {plant.primaryImageUrl ? (
          <img 
            src={plant.primaryImageUrl} 
            alt={plant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-4xl">🌿</div>
        )}
        
        {/* Health Indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${healthStatus.color}`}></div>
        
        {/* Scientific Name Badge */}
        {plant.scientificName && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {plant.scientificName}
          </div>
        )}
      </div>

      {/* Plant Info */}
      <div className="p-3">
        {/* Name */}
        <h3 className="text-body font-medium text-gray-900 mb-1 truncate">
          {plant.name}
        </h3>
        
        {/* Variety */}
        {plant.variety && (
          <p className="text-caption text-gray-600 mb-2 truncate">
            {plant.variety}
          </p>
        )}

        {/* Location */}
        {location && (
          <p className="text-caption text-gray-500 mb-2 flex items-center">
            <span className="mr-1">📍</span>
            {location.city}
          </p>
        )}

        {/* Care Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-sm">💧</span>
            <span className="text-caption text-gray-600">
              {daysSinceWatering 
                ? `${daysSinceWatering}d ago` 
                : 'Never watered'
              }
            </span>
          </div>
          
          <div className={`text-xs px-2 py-1 rounded-full ${
            healthStatus.status === 'healthy' 
              ? 'bg-plant-healthy/10 text-plant-healthy' 
              : healthStatus.status === 'warning'
              ? 'bg-needs-attention/10 text-needs-attention'
              : healthStatus.status === 'critical'
              ? 'bg-critical-care/10 text-critical-care'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {healthStatus.text}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
          <button className="flex-1 text-xs text-nile-blue hover:bg-nile-blue/10 py-2 rounded transition-colors">
            💧 Water
          </button>
          <button className="flex-1 text-xs text-lotus-green hover:bg-lotus-green/10 py-2 rounded transition-colors">
            ✂️ Prune
          </button>
          <button className="flex-1 text-xs text-gray-600 hover:bg-gray-100 py-2 rounded transition-colors">
            👁️ View
          </button>
        </div>
      </div>
    </Link>
  );
};

export default PlantCard;