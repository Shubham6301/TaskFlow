import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/projects', icon: '◈', label: 'Projects' },
  { to: '/tasks', icon: '◻', label: 'Tasks' },
  { to: '/team', icon: '◎', label: 'Team' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const avatarColors = ['#7c6af8','#4ade80','#f472b6','#60a5fa','#fb923c','#fbbf24'];
  const color = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">TF</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-info">
            <div className="avatar avatar-md" style={{ background: color + '22', color }}>
              {user?.avatar || user?.name?.[0]}
            </div>
            <div className="user-details">
              <div className="user-name truncate">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">⇥</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
