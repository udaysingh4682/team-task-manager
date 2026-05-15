import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Calendar from './Calendar';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const avatarColors = ['#0d6b3c', '#1e40af', '#92400e', '#7c3aed', '#db2777', '#0891b2', '#ca8a04', '#dc2626'];

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'fa-solid fa-table-columns' },
  { label: 'Tasks', path: '/tasks', icon: 'fa-solid fa-list-check' },
  { label: 'Projects', path: '/projects', icon: 'fa-solid fa-folder-open' },
];

const tabs = [
  { label: 'All', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Tasks', path: '/tasks' },
];

export default function Layout({ children, activeTab }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = getInitial(user?.name);
  const colorIndex = user?.name ? user.name.length % avatarColors.length : 0;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <i className="fa-solid fa-circle-check"></i>
            <span>Donezo</span>
          </div>
        </div>

        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon-placeholder"><i className={item.icon}></i></span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          {user?.role === 'admin' && (
            <li>
              <Link
                to="/admin"
                className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              >
                <span className="nav-icon-placeholder"><i className="fa-solid fa-shield-halved"></i></span>
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>

        <div className="sidebar-spacer" />

        <div className="sidebar-calendar">
          <Calendar />
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ color: '#dc3545' }}>
            <span className="nav-icon-placeholder"><i className="fa-solid fa-right-from-bracket"></i></span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main-wrapper">
        {/* Top Bar */}
          <div className="top-bar">
            <div className="search-bar">
              <i className="fa-solid fa-magnifying-glass search-bar-icon"></i>
              <input
                type="text"
                placeholder="Search projects and tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); setSearchQuery(''); } }}
              />
            </div>
            <div className="top-actions">
            <button className="btn-create" onClick={() => navigate('/projects?new=true')}>
              <i className="fa-solid fa-plus"></i> Add Project
            </button>
            <div
              className="profile-pic"
              style={{
                backgroundColor: avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {initial}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-heading)' }}>{user?.name || 'User'}</div>
              <small style={{ fontSize: 11, color: 'var(--color-muted)' }}>{user?.email || ''}</small>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              className={`tab-btn ${activeTab === tab.label.toLowerCase() ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              {tab.label}
            </button>
          ))}
          {user?.role === 'admin' && (
            <button
              className={`tab-btn ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              Admin
            </button>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
