import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { avatarColor } from '../utils/helpers';
import './TeamPage.css';

export default function TeamPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    if (userId === user.id) return addToast("Can't change your own role", 'error');
    try {
      const r = await api.put(`/users/${userId}`, { role });
      setUsers(u => u.map(us => us.id === userId ? r.data.user : us));
      addToast('Role updated!');
    } catch { addToast('Failed to update role', 'error'); }
  };

  if (loading) return <div className="loader">Loading team...</div>;

  const admins = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  return (
    <div className="team-page">
      <div className="page-header">
        <h1>Team</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>{users.length} members</p>
      </div>

      <div className="team-stats">
        <div className="team-stat card">
          <div className="team-stat-value">{users.length}</div>
          <div className="team-stat-label">Total Members</div>
        </div>
        <div className="team-stat card">
          <div className="team-stat-value">{admins.length}</div>
          <div className="team-stat-label">Admins</div>
        </div>
        <div className="team-stat card">
          <div className="team-stat-value">{members.length}</div>
          <div className="team-stat-label">Members</div>
        </div>
      </div>

      <div className="team-grid">
        {users.map(u => (
          <div key={u.id} className="team-card card">
            <div className="team-card-top">
              <div className="avatar avatar-lg"
                style={{ background: avatarColor(u.name) + '22', color: avatarColor(u.name) }}>
                {u.avatar || u.name?.[0]}
              </div>
              {u.id === user.id && <span className="you-badge">You</span>}
            </div>
            <div className="team-card-info">
              <div className="team-name">{u.name}</div>
              <div className="team-email text-muted text-sm">{u.email}</div>
            </div>
            <div className="team-card-footer">
              {user.role === 'admin' && u.id !== user.id ? (
                <select
                  className={`role-select badge badge-${u.role}`}
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}>
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              ) : (
                <span className={`badge badge-${u.role}`}>{u.role}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
