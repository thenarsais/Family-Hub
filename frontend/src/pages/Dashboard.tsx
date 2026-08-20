import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  console.log('[DASHBOARD] *** COMPONENT MOUNTING ***');
  const { user } = useAuth();
  console.log('[DASHBOARD] Component authenticated, user:', user?.name);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>✅ Dashboard Loaded Successfully</h1>
      <p>Authenticated as: {user?.name}</p>
      <p>User ID: {user?.id}</p>
    </div>
  );
}
