import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import { useAuth } from '@/stores/authStore';
import PlantCard from '@components/plants/PlantCard';
import LoadingSkeleton from '@components/ui/LoadingSkeleton';
import EmptyState from '@components/ui/EmptyState';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  // Fetch user's plants
  const { data: plantsResponse, isLoading: plantsLoading, error: plantsError } = useQuery({
    queryKey: ['plants'],
    queryFn: () => apiClient.getPlants(),
  });

  // Fetch plant stats
  const { data: statsResponse } = useQuery({
    queryKey: ['plant-stats'],
    queryFn: () => apiClient.getPlantStats(),
  });

  // Fetch recent care actions
  const { data: recentCareResponse } = useQuery({
    queryKey: ['recent-care'],
    queryFn: () => apiClient.getRecentCareActions(5),
  });

  const plants = plantsResponse?.data?.plants || [];
  const stats = statsResponse?.data?.stats;
  const recentCare = recentCareResponse?.data?.recentActions || [];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { en: 'Good Morning', ar: 'صباح الخير' };
    } else if (hour < 18) {
      return { en: 'Good Afternoon', ar: 'مساء الخير' };
    } else {
      return { en: 'Good Evening', ar: 'مساء الخير' };
    }
  };

  const greeting = getTimeGreeting();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <section className="bg-sand-gradient rounded-lg p-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-h1 text-lotus-green mb-2">
            {greeting.en}, {user?.firstName}! 🌱
          </h2>
          <p className="text-h2 font-arabic arabic-text text-lotus-green mb-4">
            {greeting.ar}، {user?.firstName}!
          </p>
          
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-lotus-green">{stats.total}</p>
                <p className="text-caption text-gray-600">Total Plants</p>
                <p className="text-caption font-arabic arabic-text text-gray-500">النباتات</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-nile-blue">{stats.indoor}</p>
                <p className="text-caption text-gray-600">Indoor</p>
                <p className="text-caption font-arabic arabic-text text-gray-500">داخلي</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-plant-healthy">{stats.outdoor}</p>
                <p className="text-caption text-gray-600">Outdoor</p>
                <p className="text-caption font-arabic arabic-text text-gray-500">خارجي</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* My Plants Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-h2 text-gray-900">My Plants</h3>
            <p className="text-body font-arabic arabic-text text-gray-600">نباتاتي</p>
          </div>
          {plants.length > 0 && (
            <Link 
              to="/plants"
              className="text-nile-blue text-label hover:underline"
            >
              View All →
              <span className="block text-caption font-arabic arabic-text">عرض الكل</span>
            </Link>
          )}
        </div>

        {plantsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-48" />
            ))}
          </div>
        ) : plantsError ? (
          <div className="bg-red-50 border border-red-200 rounded-sm p-4">
            <p className="text-red-700">Failed to load plants</p>
            <p className="text-red-600 font-arabic arabic-text">فشل في تحميل النباتات</p>
          </div>
        ) : plants.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="No Plants Yet"
            titleAr="لا توجد نباتات بعد"
            description="Start your garden by adding your first plant!"
            descriptionAr="ابدأ حديقتك بإضافة نباتك الأول!"
            actionText="Add Plant"
            actionTextAr="إضافة نبات"
            actionLink="/plants/add"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {plants.slice(0, 4).map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Care Section */}
      {recentCare.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-h2 text-gray-900">Recent Care</h3>
              <p className="text-body font-arabic arabic-text text-gray-600">العناية الأخيرة</p>
            </div>
            <Link 
              to="/care"
              className="text-nile-blue text-label hover:underline"
            >
              View All →
              <span className="block text-caption font-arabic arabic-text">عرض الكل</span>
            </Link>
          </div>

          <div className="space-y-3">
            {recentCare.map((care) => (
              <div key={care.id} className="bg-white rounded-sm p-4 shadow-plant-card">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {care.type === 'WATERING' && '💧'}
                    {care.type === 'FERTILIZING' && '🌱'}
                    {care.type === 'PRUNING' && '✂️'}
                    {care.type === 'REPOTTING' && '🪴'}
                    {care.type === 'OBSERVATION' && '👁️'}
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-medium">{care.plantName}</p>
                    <p className="text-caption text-gray-600">
                      {care.type.toLowerCase().replace('_', ' ')} • {new Date(care.performedAt).toLocaleDateString()}
                    </p>
                    {care.notes && (
                      <p className="text-caption text-gray-500 mt-1">{care.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <Link
          to="/identify"
          className="bg-white rounded-sm p-6 shadow-plant-card hover:shadow-lg transition-shadow text-center"
        >
          <div className="text-3xl mb-2">📷</div>
          <h4 className="text-body font-medium text-lotus-green">Identify Plant</h4>
          <p className="text-caption font-arabic arabic-text text-gray-600">تشخيص النبات</p>
        </Link>

        <Link
          to="/plants/add"
          className="bg-white rounded-sm p-6 shadow-plant-card hover:shadow-lg transition-shadow text-center"
        >
          <div className="text-3xl mb-2">➕</div>
          <h4 className="text-body font-medium text-lotus-green">Add Plant</h4>
          <p className="text-caption font-arabic arabic-text text-gray-600">إضافة نبات</p>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;