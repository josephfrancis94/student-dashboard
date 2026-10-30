import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-spotlight">
          <div className="brand-mark large">SD</div>
          <p className="eyebrow light">Student operations</p>
          <h1>One place for every student story.</h1>
          <p className="spotlight-copy">
            Monitor attendance, track academic performance, and keep your school teams aligned with a
            single streamlined dashboard.
          </p>

          <div className="auth-metrics">
            <div className="auth-metric">
              <strong>2.4k</strong>
              <span>records updated</span>
            </div>
            <div className="auth-metric">
              <strong>96%</strong>
              <span>team efficiency</span>
            </div>
          </div>

          <ul className="auth-feature-list">
            <li>Attendance tracking</li>
            <li>Academic performance insights</li>
            <li>Role-aware staff workflows</li>
          </ul>
        </aside>

        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark large brand-mark-soft">SD</div>
            <p className="eyebrow">Welcome back</p>
            <h1>Student Dashboard</h1>
            <p>Sign in to manage students, records, courses, attendance, and results.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <div className="auth-inline-row">
              <Link className="text-link" to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-switcher">
            Don’t have an account? <Link to="/register">Create one</Link>
          </div>

          <div className="demo-note">
            <strong>Notes:</strong> Use the credentials from your API user account. If you are not registered,
            create a user via the backend API first.
          </div>
        </div>
      </div>
    </div>
  );
}
