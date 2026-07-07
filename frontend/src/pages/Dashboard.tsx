import { useEffect, useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { apiClient } from '@services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          const pointsData = await apiClient.getUserPoints(user.id);
          const badgesData = await apiClient.getUserBadges(user.id);
          setUserPoints(pointsData.data.total_points);
          setTotalBadges(badgesData.meta.total_badges);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  if (isLoading) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">Here's your activity overview</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Points Card */}
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Points</p>
              <p className="text-4xl font-bold text-primary-600 mt-2">{userPoints}</p>
            </div>
            <span className="text-5xl">⭐</span>
          </div>
        </div>

        {/* Badges Card */}
        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Badges Earned</p>
              <p className="text-4xl font-bold text-secondary-600 mt-2">{totalBadges}</p>
            </div>
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Streak</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">7 days</p>
            </div>
            <span className="text-5xl">🔥</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="btn btn-primary">Start Activity</button>
          <button className="btn btn-secondary">View Badges</button>
          <button className="btn btn-secondary">Check Leaderboard</button>
          <button className="btn btn-secondary">Account Settings</button>
        </div>
      </div>
    </div>
  );
}
