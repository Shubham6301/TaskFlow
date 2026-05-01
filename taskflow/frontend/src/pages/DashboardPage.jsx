import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { isOverdue, formatDate } from '../utils/helpers';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader">Loading dashboard...</div>;

  const { stats, recentTasks, overdueTasks, myTasks } = data || {};

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: '◻', color: '#7c6af8' },
    { label: 'My Tasks', value: stats?.myTasks ?? 0, icon: '◎', color: '#60a5fa' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: '⚠', color: '#f87171' },
    { label: 'Due Today', value: stats?.dueToday ?? 0, icon: '◷', color: '#fbbf24' },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted" style={{marginTop:4}}>Here's what's happening today</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ color: s.color, background: s.color + '15' }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{marginBottom:16}}>Task Status</h3>
          {[
            { key: 'todo', label: 'To Do', color: '#7a7a96' },
            { key: 'in_progress', label: 'In Progress', color: '#60a5fa' },
            { key: 'in_review', label: 'In Review', color: '#fbbf24' },
            { key: 'done', label: 'Done', color: '#4ade80' },
          ].map(({ key, label, color }) => {
            const count = stats?.statusBreakdown?.[key] ?? 0;
            const total = stats?.total || 1;
            return (
              <div key={key} style={{marginBottom:12}}>
                <div className="flex justify-between text-sm" style={{marginBottom:4}}>
                  <span>{label}</span>
                  <span className="text-muted">{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(count/total)*100}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <h3 style={{marginBottom:16}}>⚠ Overdue Tasks</h3>
          {overdueTasks?.length === 0 ? (
            <div className="empty-state" style={{padding:'30px 0'}}>
              <span className="empty-icon">✓</span>
              <p>No overdue tasks!</p>
            </div>
          ) : (
            <div className="task-list">
              {overdueTasks?.map(t => (
                <div key={t.id} className="task-row">
                  <div>
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted" style={{marginTop:2}}>
                      {t.project?.name} · <span className="overdue">{formatDate(t.dueDate)}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Tasks */}
      <div className="card" style={{marginTop:20}}>
        <div className="flex justify-between items-center" style={{marginBottom:16}}>
          <h3>My Assigned Tasks</h3>
          <Link to="/tasks" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {myTasks?.length === 0 ? (
          <div className="empty-state" style={{padding:'30px 0'}}>
            <span className="empty-icon">◻</span>
            <p>No tasks assigned to you</p>
          </div>
        ) : (
          <div className="recent-tasks">
            {myTasks?.map(t => (
              <div key={t.id} className="recent-task-row">
                <div className="task-status-dot" style={{ background: statusColor(t.status) }} />
                <div style={{flex:1, minWidth:0}}>
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted">{t.project?.name}</div>
                </div>
                <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                {t.dueDate && (
                  <span className={`text-xs ${isOverdue(t.dueDate) && t.status !== 'done' ? 'overdue' : 'text-muted'}`}>
                    {formatDate(t.dueDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function statusColor(s) {
  return { todo: '#7a7a96', in_progress: '#60a5fa', in_review: '#fbbf24', done: '#4ade80' }[s] || '#7a7a96';
}
