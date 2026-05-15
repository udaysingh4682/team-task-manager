import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Tasks() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/dashboard/stats'),
    ]).then(([projRes, statsRes]) => {
      setProjects(projRes.data);
      const allTasks = statsRes.data.recentTasks || [];
      setTasks(allTasks);

      const projectIds = projRes.data.map((p) => p.id);
      if (projectIds.length > 0) {
        Promise.all(
          projectIds.map((pid) => api.get(`/tasks/project/${pid}`))
        ).then((results) => {
          const merged = results.flatMap((r) => r.data);
          merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setTasks(merged);
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';

  const handleFilterChange = (key) => {
    setFilter(key);
    if (key === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: key });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const projectMap = {};
  projects.forEach((p) => { projectMap[p.id] = p.name; });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <Layout activeTab="all">
      <div className="page-content">
        <div className="page-header">
          <h1>All Tasks</h1>
        </div>

        <div className="filter-bar">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-muted)' }}>No tasks found</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    {isAdmin && <th style={{ width: 60 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task) => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 500 }}>{task.title}</td>
                      <td>
                        <Link to={`/projects/${task.project_id}`} style={{ color: 'var(--primary-blue)' }}>
                          {task.project_name || projectMap[task.project_id] || 'Unknown'}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-light)' }}>
                        {task.assigned_to_name || 'Unassigned'}
                      </td>
                      <td>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td style={{ color: 'var(--text-light)' }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span className={`badge badge-${task.status}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
