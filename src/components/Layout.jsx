import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Students', to: '/students' },
    { label: 'Courses', to: '/courses' },
    { label: 'Attendance', to: '/attendance' },
    { label: 'Results', to: '/results' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">SD</div>
          <div>
            <p className="eyebrow">Management</p>
            <h2>Student Dashboard</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-card">
          <p className="user-role">{user?.role || 'User'}</p>
          <h3>{user?.name || 'Student Admin'}</h3>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Welcome back</h2>
          </div>
          <div className="topbar-meta">
            <span className="date-pill">{today}</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
