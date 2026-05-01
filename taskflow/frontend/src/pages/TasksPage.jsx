import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { formatDate, avatarColor, isOverdue } from '../utils/helpers';
import './TasksPage.css';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', projectId: '', mine: false });

  useEffect(() => {
    Promise.all([
      api.get('/tasks'),
      api.get('/projects')
    ]).then(([tr, pr]) => {
      setTasks(tr.data.tasks);
      setProjects(pr.data.projects);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(t => t.filter(task => task.id !== id));
      addToast('Task deleted');
    } catch { addToast('Failed', 'error'); }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const r = await api.put(`/tasks/${task.id}`, { status });
      setTasks(t => t.map(tk => tk.id === task.id ? r.data.task : tk));
    } catch { addToast('Failed to update', 'error'); }
  };

  const filtered = tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.projectId && t.projectId !== filters.projectId) return false;
    if (filters.mine && t.assigneeId !== user.id) return false;
    return true;
  });

  if (loading) return <div className="loader">Loading tasks...</div>;

  return (
    <div className="tasks-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Tasks</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>{filtered.length} tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>+ New Task</button>
      </div>

      {/* Filters */}
      <div className="tasks-filters card" style={{ marginBottom: 20 }}>
        <div className="filters-row">
          <select className="form-input filter-select" value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-input filter-select" value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="form-input filter-select" value={filters.projectId}
            onChange={e => setFilters(f => ({ ...f, projectId: e.target.value }))}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="mine-toggle">
            <input type="checkbox" checked={filters.mine}
              onChange={e => setFilters(f => ({ ...f, mine: e.target.checked }))} />
            <span>My Tasks</span>
          </label>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', projectId: '', mine: false })}>
            Clear
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">◻</span>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create a new task</p>
        </div>
      ) : (
        <div className="tasks-table card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="task-title-cell">
                    <span className="task-name">{t.title}</span>
                    {t.description && <span className="task-desc text-xs text-muted">{t.description}</span>}
                  </td>
                  <td>
                    {t.project && (
                      <div className="flex items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.project.color, flexShrink: 0 }} />
                        <span className="text-sm truncate" style={{ maxWidth: 120 }}>{t.project.name}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <select className={`status-select badge badge-${t.status}`}
                      value={t.status} onChange={e => handleStatusChange(t, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td>
                    {t.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm"
                          style={{ background: avatarColor(t.assignee.name) + '22', color: avatarColor(t.assignee.name) }}>
                          {t.assignee.avatar || t.assignee.name?.[0]}
                        </div>
                        <span className="text-sm">{t.assignee.name}</span>
                      </div>
                    ) : <span className="text-muted text-sm">—</span>}
                  </td>
                  <td>
                    {t.dueDate ? (
                      <span className={`text-sm ${isOverdue(t.dueDate) && t.status !== 'done' ? 'overdue' : 'text-muted'}`}>
                        {formatDate(t.dueDate)}
                      </span>
                    ) : <span className="text-muted text-sm">—</span>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit"
                        onClick={() => { setEditTask(t); setShowModal(true); }}>✏</button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete"
                        onClick={() => handleDelete(t.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TaskModal
          projects={projects}
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSaved={task => {
            if (editTask) setTasks(t => t.map(tk => tk.id === task.id ? task : tk));
            else setTasks(t => [task, ...t]);
            setShowModal(false); setEditTask(null);
            addToast(editTask ? 'Task updated!' : 'Task created!');
          }}
        />
      )}
    </div>
  );
}

function TaskModal({ projects, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'todo', priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '', assigneeId: task?.assigneeId || '',
    projectId: task?.projectId || ''
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (form.projectId) {
      api.get(`/projects/${form.projectId}`).then(r => setMembers(r.data.project.members || []));
    }
  }, [form.projectId]);

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
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input name="title" className="form-input" value={form.title} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" value={form.description} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select name="projectId" className="form-input" value={form.projectId} onChange={handle} required>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={form.status} onChange={handle}>
                {['todo', 'in_progress', 'in_review', 'done'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" className="form-input" value={form.priority} onChange={handle}>
                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select name="assigneeId" className="form-input" value={form.assigneeId} onChange={handle}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
