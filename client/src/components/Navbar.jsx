import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>
            Dashboard
          </Link>
          <Link to="/projects" className={isActive('/projects')}>
            Projects
          </Link>
          <Link to="/tasks" className={isActive('/tasks')}>
            Tasks
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>
              Admin
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            {user?.name} ({user?.role})
          </span>
          <button className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
