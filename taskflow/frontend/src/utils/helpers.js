export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const isOverdue = (date) => {
  if (!date) return false;
  return new Date(date + 'T00:00:00') < new Date(new Date().toDateString());
};

export const avatarColor = (name = '') => {
  const colors = ['#7c6af8','#4ade80','#f472b6','#60a5fa','#fb923c','#fbbf24','#34d399','#a78bfa'];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
