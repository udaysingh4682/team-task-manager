import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        setProjects(res.data.projects || []);
        setTasks(res.data.tasks || []);
        setSearched(true);
      })
      .catch(() => setSearched(true))
      .finally(() => setLoading(false));
  }, [query]);

  const totalResults = projects.length + tasks.length;

  return (
    <Layout activeTab="all">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Search Results</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              {query ? `Results for "${query}"` : 'Enter a search term'}
            </p>
          </div>
        </div>

        {!query.trim() && (
          <div className="card empty-state">
            <p>Type something in the search bar to find projects and tasks.</p>
          </div>
        )}

        {loading && <div className="loading">Searching...</div>}

        {searched && !loading && totalResults === 0 && (
          <div className="card empty-state">
            <p>No results found for "{query}"</p>
          </div>
        )}

        {searched && !loading && totalResults > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Projects */}
            {projects.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3>Projects ({projects.length})</h3>
                </div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="search-result-item"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <div className="search-result-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
                      <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-title">{p.name}</div>
                      <div className="search-result-meta">
                        {p.description ? p.description.substring(0, 100) : 'No description'}
                      </div>
                    </div>
                    <div className="search-result-badge" style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                      {p.member_count} members · {p.task_count} tasks
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3>Tasks ({tasks.length})</h3>
                </div>
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="search-result-item"
                    onClick={() => navigate(`/projects/${t.project_id}`)}
                  >
                    <div className={`search-result-icon ${t.status === 'completed' ? 'search-icon-completed' : t.status === 'in_progress' ? 'search-icon-progress' : 'search-icon-pending'}`}>
                      <i className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : 'fa-clock'}`}></i>
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-title">{t.title}</div>
                      <div className="search-result-meta">
                        {t.project_name} {t.assigned_to_name ? `· ${t.assigned_to_name}` : ''} {t.due_date ? `· Due ${new Date(t.due_date).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
