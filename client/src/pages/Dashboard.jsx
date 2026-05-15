import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout activeTab="all"><div className="loading">Loading dashboard...</div></Layout>;
  if (!stats) return <Layout activeTab="all"><div className="loading">Failed to load dashboard</div></Layout>;

  const totalProjects = stats.totalProjects || 0;
  const tasks = stats.tasks || {};
  const completedTasks = Number(tasks.completed) || 0;
  const inProgressTasks = Number(tasks.in_progress) || 0;
  const pendingTasks = Number(tasks.pending) || 0;
  const totalTasks = Number(tasks.total) || (pendingTasks + inProgressTasks + completedTasks) || 1;
  const overdue = Array.isArray(stats.overdue) ? stats.overdue.length : Number(stats.overdue) || 0;

  const pendingPct = (pendingTasks / totalTasks) * 100;
  const inProgressPct = (inProgressTasks / totalTasks) * 100;
  const completedPct = (completedTasks / totalTasks) * 100;

  const pieGradient = `conic-gradient(
    #f59e0b 0% ${pendingPct}%,
    #3b82f6 ${pendingPct}% ${pendingPct + inProgressPct}%,
    #10b981 ${pendingPct + inProgressPct}% 100%
  )`;

  return (
    <Layout activeTab="all">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Overview of your projects and tasks
            </p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Projects</p>
            <div className="stat-number">{totalProjects}</div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks?status=pending')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>Pending Tasks</p>
            <div className="stat-number">{pendingTasks}</div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks?status=in_progress')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>In Progress</p>
            <div className="stat-number">{inProgressTasks}</div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks?status=completed')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>Completed</p>
            <div className="stat-number">{completedTasks}</div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Pie Chart */}
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: 20 }}>
              Task Overview
            </h3>
            <div className="pie-chart">
              <div className="pie-chart-container">
                <div
                  className="pie-chart-canvas"
                  style={{ background: pieGradient }}
                />
                <div className="pie-chart-center">
                  <div className="pie-chart-center-value">{totalTasks}</div>
                  <div className="pie-chart-center-label">Total</div>
                </div>
              </div>
              <div className="pie-chart-legend">
                <div className="pie-chart-legend-item">
                  <span className="pie-chart-legend-dot" style={{ background: '#f59e0b' }}></span>
                  <span className="pie-chart-legend-label">Pending</span>
                  <span className="pie-chart-legend-value">{pendingTasks}</span>
                </div>
                <div className="pie-chart-legend-item">
                  <span className="pie-chart-legend-dot" style={{ background: '#3b82f6' }}></span>
                  <span className="pie-chart-legend-label">In Progress</span>
                  <span className="pie-chart-legend-value">{inProgressTasks}</span>
                </div>
                <div className="pie-chart-legend-item">
                  <span className="pie-chart-legend-dot" style={{ background: '#10b981' }}></span>
                  <span className="pie-chart-legend-label">Completed</span>
                  <span className="pie-chart-legend-value">{completedTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Alert */}
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: 20 }}>
              Alerts & Status
            </h3>
            {overdue > 0 ? (
              <div className="alert-overdue">
                <div className="alert-overdue-icon">⚠️</div>
                <div>
                  <div className="alert-overdue-title">
                    {overdue} Overdue Task{overdue > 1 ? 's' : ''}
                  </div>
                  <div className="alert-overdue-sub">
                    Need{overdue === 1 ? 's' : ''} immediate attention
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert-clear">
                <div className="alert-clear-icon">✅</div>
                <div>
                  <div className="alert-clear-title">All Clear</div>
                  <div className="alert-clear-sub">All tasks are on track</div>
                </div>
              </div>
            )}
            <div className="actions-row" style={{ marginTop: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
                <i className="fa-solid fa-folder-open"></i> View Projects
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/tasks')}>
                <i className="fa-solid fa-list-check"></i> View Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
