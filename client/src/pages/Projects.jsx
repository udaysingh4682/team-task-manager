import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then((res) => {
      setProjects(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
    if (searchParams.get('new') === 'true') {
      setShowModal(true);
      setSearchParams({});
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/projects', form);
    setShowModal(false);
    setForm({ name: '', description: '' });
    fetchProjects();
  };

  const handleDeleteProject = async (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete project "${name}"? This will delete all associated tasks and members.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  return (
    <Layout activeTab="projects">
      <div className="page-content">
        <div className="page-header">
          <h1>Projects</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="card empty-state">
            <p style={{ marginBottom: 16 }}>No projects yet</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {projects.map((project) => (
              <div key={project.id} className="project-card" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
                <div className="project-meta">
                  <span>👥 {project.member_count} members</span>
                  <span>📋 {project.task_count} tasks</span>
                </div>
                {user?.role === 'admin' && (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', fontSize: 12 }}
                    onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>New Project</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Enter project name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the project"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
