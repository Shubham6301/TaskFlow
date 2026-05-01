import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { formatDate, avatarColor, isOverdue } from '../utils/helpers';
import './ProjectDetailPage.css';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetch = () => api.get(`/projects/${id}`).then(r => setProject(r.data.project)).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, [id]);

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setProject(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== taskId) }));
      addToast('Task deleted');
    } catch { addToast('Failed', 'error'); }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const r = await api.put(`/tasks/${task.id}`, { status });
      setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === task.id ? r.data.task : t) }));
    } catch { addToast('Failed to update', 'error'); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }));
      addToast('Member removed');
    } catch { addToast('Failed', 'error'); }
  };

  if (loading) return <div className="loader">Loading project...</div>;
  if (!project) return <div className="empty-state"><p>Project not found</p><Link to="/projects" className="btn btn-secondary">← Back</Link></div>;

  const canManage = user.role === 'admin' || project.ownerId === user.id ||
    project.members?.find(m => m.id === user.id)?.ProjectMember?.role === 'admin';

  const filteredTasks = filter === 'all' ? project.tasks : project.tasks?.filter(t => t.status === filter);

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <Link to="/projects" className="back-link">← Projects</Link>
        <div className="project-title-row">
          <div className="project-color-indicator" style={{ background: project.color }} />
          <h1>{project.name}</h1>
          <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
        </div>
        {project.description && <p className="text-muted">{project.description}</p>}
        <div className="project-stats-row">
          <span className="text-sm text-muted">{project.taskCount} tasks · {project.progress}% complete</span>
          {project.dueDate && <span className={`text-sm ${isOverdue(project.dueDate) ? 'overdue' : 'text-muted'}`}>Due {formatDate(project.dueDate)}</span>}
        </div>
        <div className="progress-bar" style={{marginTop:8}}>
          <div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} />
        </div>
      </div>

      <div className="project-body">
        {/* Tasks */}
        <div className="tasks-section">
          <div className="section-header">
            <h2>Tasks</h2>
            <div className="filter-tabs">
              {['all', ...STATUSES].map(s => (
                <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
              ))}
            </div>
            {canManage && <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>+ Task</button>}
          </div>

          {filteredTasks?.length === 0 ? (
            <div className="empty-state" style={{padding:'40px 0'}}>
              <span className="empty-icon">◻</span>
              <p>No tasks {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
            </div>
          ) : (
            <div className="task-cards">
              {filteredTasks?.map(t => (
                <div key={t.id} className="task-card card">
                  <div className="task-card-header">
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                      {canManage && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditTask(t); setShowTaskModal(true); }}>✏</button>}
                      {(canManage || t.createdById === user.id) && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteTask(t.id)}>✕</button>}
                    </div>
                  </div>
                  <div className="task-title">{t.title}</div>
                  {t.description && <p className="text-sm text-muted">{t.description}</p>}
                  <div className="task-card-footer">
                    <select className={`status-select badge badge-${t.status}`}
                      value={t.status} onChange={e => handleStatusChange(t, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    {t.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm" style={{ background: avatarColor(t.assignee.name) + '22', color: avatarColor(t.assignee.name) }}>
                          {t.assignee.avatar || t.assignee.name?.[0]}
                        </div>
                        <span className="text-xs text-muted">{t.assignee.name}</span>
                      </div>
                    ) : <span className="text-xs text-muted">Unassigned</span>}
                    {t.dueDate && <span className={`text-xs ${isOverdue(t.dueDate) && t.status !== 'done' ? 'overdue' : 'text-muted'}`}>{formatDate(t.dueDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="members-section">
          <div className="section-header">
            <h2>Members</h2>
            {canManage && <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add</button>}
          </div>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.id} className="member-row">
                <div className="avatar avatar-md" style={{ background: avatarColor(m.name) + '22', color: avatarColor(m.name) }}>
                  {m.avatar || m.name?.[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted">{m.email}</div>
                </div>
                <span className={`badge badge-${m.ProjectMember?.role || 'member'}`}>{m.ProjectMember?.role || 'member'}</span>
                {canManage && m.id !== project.ownerId && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleRemoveMember(m.id)}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          project={project}
          task={editTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={task => {
            if (editTask) setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === task.id ? task : t) }));
            else setProject(p => ({ ...p, tasks: [task, ...(p.tasks || [])] }));
            setShowTaskModal(false); setEditTask(null);
            addToast(editTask ? 'Task updated!' : 'Task created!');
          }}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          existingIds={project.members?.map(m => m.id)}
          onClose={() => setShowMemberModal(false)}
          onAdded={() => { fetch(); setShowMemberModal(false); addToast('Member added!'); }}
        />
      )}
    </div>
  );
}

function TaskModal({ project, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'todo', priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '', assigneeId: task?.assigneeId || '',
    projectId: project.id
  });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const r = task ? await api.put(`/tasks/${task.id}`, form) : await api.post('/tasks', form);
      onSaved(r.data.task);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input name="title" className="form-input" value={form.title} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" value={form.description} onChange={handle} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={form.status} onChange={handle}>
                {['todo','in_progress','in_review','done'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" className="form-input" value={form.priority} onChange={handle}>
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select name="assigneeId" className="form-input" value={form.assigneeId} onChange={handle}>
                <option value="">Unassigned</option>
                {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input name="dueDate" type="date" className="form-input" value={form.dueDate} onChange={handle} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : task ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, existingIds, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users.filter(u => !existingIds.includes(u.id))));
  }, []);

  const submit = async e => {
    e.preventDefault(); if (!selected) return; setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { userId: selected, role });
      onAdded();
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Add Member</h2>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-input" value={selected} onChange={e => setSelected(e.target.value)} required>
              <option value="">Choose a user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !selected}>{loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
