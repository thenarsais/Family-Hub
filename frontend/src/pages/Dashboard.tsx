import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { apiClient } from '@services/api';
import { Wifi, BookOpen, CheckCircle, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data for Phase 1 features
  const mockChores = [
    { id: 1, title: 'Clean bedroom', points: 50, status: 'pending', dueDate: '2026-07-31' },
    { id: 2, title: 'Wash dishes', points: 30, status: 'pending', dueDate: '2026-07-31' },
    { id: 3, title: 'Do homework', points: 75, status: 'in_progress', dueDate: '2026-08-02' }
  ];

  const mockLearning = [
    { id: 1, phase: 'Gujarati Alphabet', progress: 85, icon: '🔤' },
    { id: 2, phase: 'Gujarati Numbers', progress: 60, icon: '🔢' },
    { id: 3, phase: 'Gujarati Vocabulary', progress: 40, icon: '📚' }
  ];

  const mockLeaderboard = [
    { name: 'Test Child', points: 450, rank: 1 },
    { name: 'Emma', points: 380, rank: 2 },
    { name: 'Test Parent', points: 250, rank: 3 }
  ];

  const mockRecentActivity = [
    { action: 'Completed "Clean bedroom"', points: 50, time: '2 hours ago' },
    { action: 'Earned "Quiz Master" badge', points: 0, time: '1 day ago' },
    { action: 'Completed Gujarati lesson', points: 25, time: '2 days ago' }
  ];

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Points</p>
              <p className="text-4xl font-bold text-primary-600 mt-2">{userPoints}</p>
            </div>
            <span className="text-5xl">⭐</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Badges Earned</p>
              <p className="text-4xl font-bold text-secondary-600 mt-2">{totalBadges}</p>
            </div>
            <span className="text-5xl">🏆</span>
          </div>
        </div>

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

      {/* Phase 1 Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chores Module */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Chores</h2>
          </div>
          <div className="space-y-3">
            {mockChores.map((chore) => (
              <div key={chore.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div>
                  <p className="font-medium">{chore.title}</p>
                  <p className="text-xs text-gray-500">Due: {chore.dueDate}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${chore.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {chore.status === 'pending' ? 'Pending' : 'In Progress'}
                  </span>
                  <p className="text-sm font-bold text-primary-600 mt-1">+{chore.points} pts</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary w-full mt-4">View All Chores</button>
        </div>

        {/* Learning Module */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Learning Progress</h2>
          </div>
          <div className="space-y-3">
            {mockLearning.map((lesson) => (
              <div key={lesson.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{lesson.icon} {lesson.phase}</span>
                  <span className="text-sm font-bold text-primary-600">{lesson.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${lesson.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary w-full mt-4">Continue Learning</button>
        </div>
      </div>

      {/* Leaderboard & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Leaderboard</h2>
          </div>
          <div className="space-y-2">
            {mockLeaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary-600 w-8">#{entry.rank}</span>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-600">{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {mockRecentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                {activity.points > 0 && (
                  <span className="text-sm font-bold text-green-600">+{activity.points}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="btn btn-primary">Start Activity</button>
          <button
            className="btn btn-secondary flex items-center justify-center gap-2"
            onClick={() => navigate('/smartthings')}
          >
            <Wifi className="w-4 h-4" />
            Smart Home
          </button>
          <button className="btn btn-secondary">View Badges</button>
          <button className="btn btn-secondary">Check Leaderboard</button>
          <button className="btn btn-secondary">Account Settings</button>
        </div>
      </div>
    </div>
  );
}
