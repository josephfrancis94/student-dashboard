import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword, loading } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err) {
      setError(err?.message || 'We could not send a reset link. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-spotlight">
          <div className="brand-mark large">SD</div>
          <p className="eyebrow light">Account recovery</p>
          <h1>Reset access in a few seconds.</h1>
          <p className="spotlight-copy">
            We’ll help you get back to your student dashboard without disrupting your team's daily workflow.
          </p>

          <div className="auth-metrics">
            <div className="auth-metric">
              <strong>1 min</strong>
              <span>average recovery time</span>
            </div>
            <div className="auth-metric">
              <strong>24/7</strong>
              <span>support guidance</span>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark large brand-mark-soft">SD</div>
            <p className="eyebrow">Need help signing in?</p>
            <h1>Forgot password</h1>
            <p>Enter your email to receive password recovery instructions.</p>
          </div>

          {!isSubmitted ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              {error ? <div className="error-box">{error}</div> : null}

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Sending instructions...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="success-panel">
              <div className="success-box">
                Recovery instructions were sent to <strong>{email}</strong>.
              </div>
              <p className="reset-copy">
                Check your inbox for a secure link to create a new password. If you do not see it in a few
                minutes, try checking your spam folder.
              </p>
              <Link to="/login" className="secondary-button inline-button">
                Back to sign in
              </Link>
            </div>
          )}

          <div className="auth-switcher">
            Remembered your password? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
