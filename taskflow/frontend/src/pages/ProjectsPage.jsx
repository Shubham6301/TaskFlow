import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { formatDate, avatarColor } from '../utils/helpers';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = () => api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(pr => pr.id !== id));
      addToast('Project deleted');
    } catch { addToast('Failed to delete', 'error'); }
  };

  if (loading) return <div className="loader">Loading projects...</div>;

  return (
    <div className="projects-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Projects</h1>
          <p className="text-muted" style={{marginTop:4}}>{projects.length} projects total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">◈</span>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card card">
              <div className="project-card-header">
                <div className="project-color-dot" style={{ background: p.color }} />
                <span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span>
                {(user.role === 'admin' || p.ownerId === user.id) && (
                  <button className="btn btn-ghost btn-sm btn-icon" style={{marginLeft:'auto'}}
                    onClick={() => handleDelete(p.id)} title="Delete">✕</button>
                )}
              </div>

              <Link to={`/projects/${p.id}`} className="project-name">{p.name}</Link>
              {p.description && <p className="project-desc text-muted text-sm">{p.description}</p>}

              <div className="project-progress">
                <div className="flex justify-between text-xs text-muted" style={{marginBottom:6}}>
                  <span>{p.completedTasks}/{p.taskCount} tasks</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                </div>
              </div>

              <div className="project-meta">
                <div className="member-stack">
                  {p.members?.slice(0, 4).map(m => (
                    <div key={m.id} className="avatar avatar-sm" title={m.name}
                      style={{ background: avatarColor(m.name) + '22', color: avatarColor(m.name), border: '2px solid var(--bg-card)' }}>
                      {m.avatar || m.name?.[0]}
                    </div>
                  ))}
                  {p.members?.length > 4 && (
                    <div className="avatar avatar-sm" style={{background:'var(--bg-elevated)',color:'var(--text-muted)',border:'2px solid var(--bg-card)'}}>
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                {p.dueDate && <span className="text-xs text-muted">{formatDate(p.dueDate)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onCreated={pr => { setProjects(prev => [pr, ...prev]); setShowModal(false); addToast('Project created!'); }} />}
    </div>
  );
}

function ProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#7c6af8', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const COLORS = ['#7c6af8','#4ade80','#f472b6','#60a5fa','#fb923c','#fbbf24','#34d399','#f87171'];

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await api.post('/projects', form);
      onCreated(r.data.project);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New Project</h2>
        {error && <div className="auth-error" style={{marginBottom:16}}>{error}</div>}
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input name="name" className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" placeholder="What's this project about?" value={form.description} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button key={c} type="button" className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input name="dueDate" type="date" className="form-input" value={form.dueDate} onChange={handle} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
