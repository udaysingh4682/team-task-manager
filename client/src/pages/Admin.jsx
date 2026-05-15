import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [memberTasks, setMemberTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, memberTasksRes] = await Promise.all([
        api.get('/dashboard/users'),
        api.get('/dashboard/admin/stats'),
        api.get('/dashboard/admin/member-tasks'),
      ]);
      setUsers(usersRes.data);
      setAdminStats(statsRes.data);
      setMemberTasks(memberTasksRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/dashboard/admin/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/dashboard/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) return <Layout activeTab="admin"><div className="loading">Loading admin panel...</div></Layout>;

  if (user?.role !== 'admin') {
    return (
      <Layout activeTab="admin">
        <div className="page-content">
          <div className="loading">Access denied. Admin only.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab="admin">
      <div className="page-content">
        <div className="page-header">
          <h1>Admin Panel</h1>
        </div>

        {adminStats && (
          <div className="stats-row" style={{ marginBottom: 32 }}>
            <div className="stat-card">
              <div className="stat-number">{adminStats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{adminStats.totalProjects}</div>
              <div className="stat-label">Total Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{adminStats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {adminStats.tasksByStatus?.find(s => s.status === 'completed')?.count || 0}
              </div>
              <div className="stat-label">Completed Tasks</div>
            </div>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>User Management</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Projects</th>
                  <th>Tasks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-light)' }}>{u.email}</td>
                    <td>
                      <select
                        className="status-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user.id}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{u.project_count}</td>
                    <td>{u.task_count}</td>
                    <td>
                      {u.id !== user.id && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleDeleteUser(u.id, u.name)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Tasks */}
        <div className="card">
          <div className="card-header">
            <h3>Tasks Assigned to Members</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              {memberTasks.reduce((sum, m) => sum + m.taskCount, 0)} total
            </span>
          </div>
          {memberTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No members with tasks yet.</p>
          ) : (
            memberTasks.map((member) => (
              <div key={member.id} className="member-task-card">
                <div className="member-task-header">
                  <span className="member-task-name">{member.name}</span>
                  <span className="member-task-count">{member.taskCount} task{member.taskCount !== 1 ? 's' : ''}</span>
                </div>
                {member.tasks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 0' }}>No tasks assigned.</p>
                ) : (
                  member.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="member-task-item"
                      onClick={() => navigate(`/projects/${t.projectId}`)}
                    >
                      <span className={`badge badge-${t.status}`} style={{ flexShrink: 0, minWidth: 70, textAlign: 'center' }}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          {t.projectName}
                          {t.creatorId && t.creatorId !== member.id ? ' · Created by admin' : ''}
                        </div>
                      </div>
                      <span className={`member-task-due ${t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' ? 'member-task-due-overdue' : ''}`}>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
