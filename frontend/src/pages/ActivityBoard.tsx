export default function ActivityBoard() {
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-2">Activity Board</h1>
      <p className="text-gray-600 mb-8">
        Complete activities to earn points and badges
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for 20 activity sections */}
        {[
          { name: 'Games', emoji: '🎮', description: 'Play educational games' },
          { name: 'Trivia', emoji: '🧠', description: 'Test your knowledge' },
          { name: 'Homework', emoji: '📚', description: 'Complete homework tasks' },
          { name: 'Kung Fu', emoji: '🥋', description: 'Practice martial arts' },
          { name: 'Habits', emoji: '✅', description: 'Build good habits' },
          { name: 'Reading', emoji: '📖', description: 'Read and learn' },
        ].map((activity) => (
          <div key={activity.name} className="card-hover">
            <div className="text-4xl mb-4">{activity.emoji}</div>
            <h3 className="text-xl font-bold mb-2">{activity.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{activity.description}</p>
            <button className="btn btn-primary text-sm">Start Activity</button>
          </div>
        ))}
      </div>
    </div>
  );
}
