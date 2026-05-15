import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function ProjectDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium', due_date: '', assigned_to: '',
  });
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'member' });
  const [editingDueDate, setEditingDueDate] = useState(null);
  const [dateValue, setDateValue] = useState('');

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, membersRes, usersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/projects/${id}/members`),
        api.get('/dashboard/users'),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await api.post(`/tasks/project/${id}`, {
      ...taskForm,
      assigned_to: taskForm.assigned_to || null,
    });
    setShowTaskModal(false);
    setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
    const res = await api.get(`/tasks/project/${id}`);
    setTasks(res.data);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    await api.post(`/projects/${id}/members`, memberForm);
    setShowMemberModal(false);
    setMemberForm({ userId: '', role: 'member' });
    const res = await api.get(`/projects/${id}/members`);
    setMembers(res.data);
  };

  const handleStatusChange = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status });
    const res = await api.get(`/tasks/project/${id}`);
    setTasks(res.data);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    const res = await api.get(`/tasks/project/${id}`);
    setTasks(res.data);
  };

  const handleReassign = async (taskId, assignedTo) => {
    await api.put(`/tasks/${taskId}`, { assigned_to: assignedTo || null });
    const res = await api.get(`/tasks/project/${id}`);
    setTasks(res.data);
  };

  const handleDueDateChange = async (taskId) => {
    if (!dateValue) return;
    await api.put(`/tasks/${taskId}`, { due_date: dateValue });
    setEditingDueDate(null);
    setDateValue('');
    const res = await api.get(`/tasks/project/${id}`);
    setTasks(res.data);
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This will permanently delete all tasks and members.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleRemoveMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      const res = await api.get(`/projects/${id}/members`);
      setMembers(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const isAdmin = user?.role === 'admin';

  if (loading) return <Layout activeTab="projects"><div className="loading">Loading...</div></Layout>;
  if (!project) return <Layout activeTab="projects"><div className="loading">Project not found</div></Layout>;

  const nonMembers = users.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  );

  const isTodayOrPast = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d <= today;
  };

  return (
    <Layout activeTab="projects">
      <div className="page-content">
        <Link to="/projects" className="back-link">&larr; Back to Projects</Link>

        <div className="page-header">
          <div>
            <h1>{project.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{project.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
              <i className="fa-solid fa-plus"></i> Add Task
            </button>
            <button className="btn btn-outline" onClick={() => setShowMemberModal(true)}>
              <i className="fa-solid fa-user-plus"></i> Add Member
            </button>
            {isAdmin && (
              <button className="btn btn-danger" onClick={handleDeleteProject}>
                <i className="fa-solid fa-trash"></i> Delete Project
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: 32 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Members ({members.length})</h3>
            {members.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No members yet</p>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{m.name}</strong>
                    <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)' }}>{m.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    {isAdmin && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                        onClick={() => handleRemoveMember(m.id, m.name)}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Task Summary</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#fef3c7', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 24, color: '#92400e' }}>
                  {tasks.filter((t) => t.status === 'pending').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Pending</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#dbeafe', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 24, color: '#1e40af' }}>
                  {tasks.filter((t) => t.status === 'in_progress').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>In Progress</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#d1fae5', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 24, color: '#065f46' }}>
                  {tasks.filter((t) => t.status === 'completed').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Completed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Tasks ({tasks.length})</h3>
          </div>
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No tasks yet. Click "+ Add Task" to create one.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} style={isOverdue(task) ? { background: '#fef2f2' } : {}}>
                      <td style={{ fontWeight: 500 }}>
                        {task.title}
                        {isOverdue(task) && (
                          <span className="badge" style={{ background: '#dc2626', color: '#fff', marginLeft: 8, fontSize: 10 }}>
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <select
                            className="status-select"
                            value={task.assigned_to || ''}
                            onChange={(e) => handleReassign(task.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>
                            {task.assigned_to_name || 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td>
                        {isAdmin && editingDueDate === task.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="date"
                              value={dateValue}
                              onChange={(e) => setDateValue(e.target.value)}
                              style={{ width: 140, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 12, fontFamily: 'var(--font-family)' }}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleDueDateChange(task.id)}>
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setEditingDueDate(null)}>
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ) : (
                          <span
            style={{ color: isOverdue(task) ? '#dc2626' : 'var(--text-muted)', fontWeight: isOverdue(task) ? 600 : 400, cursor: isAdmin ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (!isAdmin) return;
                              setEditingDueDate(task.id);
                              setDateValue(task.due_date ? task.due_date.split('T')[0] : '');
                            }}
                          >
                            {task.due_date ? (
                              <>
                                {new Date(task.due_date).toLocaleDateString()}
                                {isAdmin && <small style={{ marginLeft: 4, opacity: 0.5 }}>✎</small>}
                              </>
                            ) : '-'}
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add Task</h2>
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                    placeholder="Task title"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Task description"
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assign To</label>
                  <select
                    value={taskForm.assigned_to}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {(isAdmin ? users : members).map((u) => (
                      <option key={u.id || u.user_id} value={u.id || u.user_id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showMemberModal && (
          <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add Member</h2>
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label>User</label>
                  <select
                    value={memberForm.userId}
                    onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                    required
                  >
                    <option value="">Select a user...</option>
                    {nonMembers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Member</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
