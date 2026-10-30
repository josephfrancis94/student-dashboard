import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  {
    value: 'staff',
    title: 'Staff access',
    subtitle: 'Manage records, classes, and attendance updates.',
    accent: 'staff',
  },
  {
    value: 'admin',
    title: 'Admin access',
    subtitle: 'Full visibility across teams, results, and academic operations.',
    accent: 'admin',
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, user, loading } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setForm((current) => ({ ...current, role }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-spotlight">
          <div className="brand-mark large">SD</div>
          <p className="eyebrow light">Access management</p>
          <h1>Build the right level of control.</h1>
          <p className="spotlight-copy">
            Choose the role that matches the way your team works, from daily academic updates to full
            administrative oversight.
          </p>

          <div className="role-preview-list">
            <div className="role-preview-item staff">
              <span className="role-preview-dot" />
              Staff
            </div>
            <div className="role-preview-item admin">
              <span className="role-preview-dot" />
              Admin
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark large brand-mark-soft">SD</div>
            <p className="eyebrow">Create account</p>
            <h1>Get started</h1>
            <p>Register to start managing students and academic records.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <div className="role-selector" aria-label="Choose a role">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  className={`role-option ${form.role === role.value ? 'selected' : ''}`}
                  onClick={() => handleRoleChange(role.value)}
                  aria-pressed={form.role === role.value}
                >
                  <span className={`role-badge ${role.accent}`}>{role.value === 'admin' ? 'Admin' : 'Staff'}</span>
                  <strong>{role.title}</strong>
                  <small>{role.subtitle}</small>
                </button>
              ))}
            </div>

            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div className="auth-switcher">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
