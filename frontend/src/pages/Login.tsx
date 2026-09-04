import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LOGIN] Form submitted with email:', email);
    setError('');
    setIsLoading(true);

    try {
      console.log('[LOGIN] Calling login function...');
      await login(email, password);
      console.log('[LOGIN] Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[LOGIN] Login failed with error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-accent-strong">
      <div className="bg-raised rounded-card shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Family Hub</h1>
        <p className="text-center text-ink-2 mb-8">Sign in to your account</p>

        {error && (
          <div className="bg-alert/10 border border-alert/40 text-alert px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-ink-2 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-strong font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
