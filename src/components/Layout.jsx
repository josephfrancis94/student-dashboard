import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rolePermissions = {
  admin: ['Users', 'Students', 'Courses', 'Attendance', 'Results', 'Settings'],
  staff: ['Students', 'Courses', 'Attendance', 'Results'],
  viewer: ['Students', 'Results'],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('student-dashboard-theme') || 'light');

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('student-dashboard-theme', theme);
  }, [theme]);

  const navItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Students', to: '/students' },
    { label: 'Courses', to: '/courses' },
    { label: 'Attendance', to: '/attendance' },
    { label: 'Attendance Analytics', to: '/attendance-analytics' },
    { label: 'Results', to: '/results' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const roleMeta = {
    admin: {
      label: 'Administrator',
      accent: 'admin',
      description: 'Full access and oversight',
    },
    staff: {
      label: 'Staff',
      accent: 'staff',
      description: 'Academic operations',
    },
    viewer: {
      label: 'Viewer',
      accent: 'viewer',
      description: 'Read-only access',
    },
  };

  const currentRole = roleMeta[user?.role] || roleMeta.staff;
  const permissions = rolePermissions[user?.role] || rolePermissions.staff;

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
            <h2>Stellar Academy</h2>
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
          <div className={`user-role-badge ${currentRole.accent}`}>
            {currentRole.label}
          </div>
          <p className="user-role">{currentRole.description}</p>
          <h3>{user?.name || 'School Admin'}</h3>

          <div className="permission-stack">
            {permissions.map((permission) => (
              <span key={permission} className="permission-chip">
                {permission}
              </span>
            ))}
          </div>

          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>Welcome back</h2>
          </div>
          <div className="topbar-meta">
            <div className={`role-chip ${currentRole.accent}`}>{currentRole.label}</div>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <span className="date-pill">{today}</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
