import { signOut, getOnlineUsers, getAllUsers, getUserActivities, subscribeToOnlineUsers } from '../auth.js';
import { supabase } from '../lib/supabase.js';

let onlineUsersChannel = null;

export function createDashboard(user) {
  const container = document.createElement('div');
  container.id = 'dashboard-page';

  container.innerHTML = `
    <nav class="navbar">
      <div class="container">
        <div class="navbar-content">
          <div class="navbar-brand">📊 Dashboard</div>
          <div class="navbar-menu">
            <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
              🌙
            </button>
            <div class="notification-badge" id="notification-badge">
              <button class="btn btn-secondary" id="notifications-btn">
                🔔
              </button>
            </div>
            <div class="user-menu">
              <button class="user-button" id="user-menu-btn">
                <div class="user-avatar" id="user-avatar">
                  ${getInitials(user.profile?.full_name || user.email)}
                </div>
                <span>${user.profile?.username || user.email}</span>
              </button>
              <div class="user-dropdown" id="user-dropdown">
                <div class="dropdown-item" id="profile-btn">
                  👤 Profile
                </div>
                <div class="dropdown-item" id="settings-btn">
                  ⚙️ Settings
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="logout-btn">
                  🚪 Sign Out
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="dashboard">
      <div class="container">
        <div class="dashboard-header">
          <h1>Welcome back, ${user.profile?.full_name || user.profile?.username || 'User'}!</h1>
          <p>Here's what's happening with your platform today.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-title">Online Users</div>
              <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                👥
              </div>
            </div>
            <div class="stat-value" id="online-count">0</div>
            <div class="stat-footer">Users currently active</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-title">Total Users</div>
              <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                👨‍👩‍👧‍👦
              </div>
            </div>
            <div class="stat-value" id="total-users">0</div>
            <div class="stat-footer">Registered accounts</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-title">Recent Activities</div>
              <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                📊
              </div>
            </div>
            <div class="stat-value" id="activity-count">0</div>
            <div class="stat-footer">Actions in last 24h</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-title">Your Status</div>
              <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                ✓
              </div>
            </div>
            <div class="stat-value" style="font-size: 20px;">
              <span class="status-indicator"></span> Online
            </div>
            <div class="stat-footer">You are active now</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">🟢 Online Users</h2>
              <span class="badge badge-success" id="online-badge">0 Online</span>
            </div>
            <div class="user-list" id="online-users-list">
              <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">No users online</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">📋 All Users</h2>
              <span class="badge badge-primary" id="all-users-badge">0 Users</span>
            </div>
            <div class="user-list" id="all-users-list">
              <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">No users found</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">📊 Recent Activity</h2>
            <button class="btn btn-secondary" id="refresh-activity-btn">
              🔄 Refresh
            </button>
          </div>
          <div class="activity-feed" id="activity-feed">
            <div class="empty-state">
              <div class="empty-state-icon">📊</div>
              <div class="empty-state-text">No recent activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="user-dropdown" id="notifications-dropdown" style="position: fixed; top: 60px; right: 24px; z-index: 1000;">
      <div style="padding: 16px; border-bottom: 1px solid var(--border);">
        <h3 style="font-size: 16px; font-weight: 600;">Notifications</h3>
      </div>
      <div class="notifications-panel" id="notifications-list">
        <div class="empty-state" style="padding: 32px;">
          <div class="empty-state-icon">🔔</div>
          <div class="empty-state-text">No notifications</div>
        </div>
      </div>
    </div>
  `;

  setupEventListeners(container, user);
  loadDashboardData(container, user);
  setupRealtimeSubscriptions(container);

  return container;
}

function setupEventListeners(container, user) {
  const userMenuBtn = container.querySelector('#user-menu-btn');
  const userDropdown = container.querySelector('#user-dropdown');
  const logoutBtn = container.querySelector('#logout-btn');
  const themeToggle = container.querySelector('#theme-toggle');
  const notificationsBtn = container.querySelector('#notifications-btn');
  const notificationsDropdown = container.querySelector('#notifications-dropdown');
  const refreshActivityBtn = container.querySelector('#refresh-activity-btn');

  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
    notificationsDropdown.classList.remove('show');
  });

  notificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsDropdown.classList.toggle('show');
    userDropdown.classList.remove('show');
    loadNotifications(container, user);
  });

  document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
    notificationsDropdown.classList.remove('show');
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  });

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
  });

  refreshActivityBtn.addEventListener('click', () => {
    loadActivities(container);
  });

  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

async function loadDashboardData(container, user) {
  await Promise.all([
    loadOnlineUsers(container),
    loadAllUsers(container),
    loadActivities(container)
  ]);
}

async function loadOnlineUsers(container) {
  try {
    const users = await getOnlineUsers();
    const onlineCount = container.querySelector('#online-count');
    const onlineBadge = container.querySelector('#online-badge');
    const onlineUsersList = container.querySelector('#online-users-list');

    onlineCount.textContent = users.length;
    onlineBadge.textContent = `${users.length} Online`;

    if (users.length === 0) {
      onlineUsersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">No users online</div>
        </div>
      `;
    } else {
      onlineUsersList.innerHTML = users.map(user => `
        <div class="user-item">
          <div class="user-item-avatar">
            ${getInitials(user.full_name || user.username)}
          </div>
          <div class="user-item-info">
            <div class="user-item-name">${user.full_name || user.username}</div>
            <div class="user-item-meta">
              <span class="status-indicator"></span>
              @${user.username}
            </div>
          </div>
          <span class="badge badge-success">Online</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading online users:', error);
  }
}

async function loadAllUsers(container) {
  try {
    const users = await getAllUsers();
    const totalUsers = container.querySelector('#total-users');
    const allUsersBadge = container.querySelector('#all-users-badge');
    const allUsersList = container.querySelector('#all-users-list');

    totalUsers.textContent = users.length;
    allUsersBadge.textContent = `${users.length} Users`;

    if (users.length === 0) {
      allUsersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">No users found</div>
        </div>
      `;
    } else {
      allUsersList.innerHTML = users.map(user => {
        const timeAgo = getTimeAgo(new Date(user.last_seen));
        return `
          <div class="user-item">
            <div class="user-item-avatar">
              ${getInitials(user.full_name || user.username)}
            </div>
            <div class="user-item-info">
              <div class="user-item-name">${user.full_name || user.username}</div>
              <div class="user-item-meta">
                ${user.is_online ? '<span class="status-indicator"></span>' : '<span class="status-indicator status-offline"></span>'}
                @${user.username} • ${timeAgo}
              </div>
            </div>
            <span class="badge ${user.is_online ? 'badge-success' : 'badge-primary'}">
              ${user.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading all users:', error);
  }
}

async function loadActivities(container) {
  try {
    const activities = await getUserActivities(20);
    const activityCount = container.querySelector('#activity-count');
    const activityFeed = container.querySelector('#activity-feed');

    const last24h = activities.filter(a => {
      const activityDate = new Date(a.created_at);
      const now = new Date();
      const diff = now - activityDate;
      return diff < 24 * 60 * 60 * 1000;
    });

    activityCount.textContent = last24h.length;

    if (activities.length === 0) {
      activityFeed.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">No recent activity</div>
        </div>
      `;
    } else {
      activityFeed.innerHTML = activities.map(activity => {
        const icon = getActivityIcon(activity.activity_type);
        const description = getActivityDescription(activity);
        const timeAgo = getTimeAgo(new Date(activity.created_at));

        return `
          <div class="activity-item">
            <div class="activity-icon">
              ${icon}
            </div>
            <div class="activity-content">
              <div class="activity-text">${description}</div>
              <div class="activity-time">${timeAgo}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading activities:', error);
  }
}

async function loadNotifications(container, user) {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const notificationsList = container.querySelector('#notifications-list');
    const badge = container.querySelector('#notification-badge');

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    if (unreadCount > 0) {
      badge.setAttribute('data-count', unreadCount);
    } else {
      badge.removeAttribute('data-count');
    }

    if (!notifications || notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="empty-state" style="padding: 32px;">
          <div class="empty-state-icon">🔔</div>
          <div class="empty-state-text">No notifications</div>
        </div>
      `;
    } else {
      notificationsList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.is_read ? '' : 'unread'}" data-id="${notif.id}">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
          <div class="notification-time">${getTimeAgo(new Date(notif.created_at))}</div>
        </div>
      `).join('');

      notificationsList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
          const notifId = item.getAttribute('data-id');
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notifId);
          item.classList.remove('unread');
          loadNotifications(container, user);
        });
      });
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function setupRealtimeSubscriptions(container) {
  if (onlineUsersChannel) {
    onlineUsersChannel.unsubscribe();
  }

  onlineUsersChannel = subscribeToOnlineUsers(() => {
    loadOnlineUsers(container);
    loadAllUsers(container);
  });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [name, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${name}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

function getActivityIcon(type) {
  const icons = {
    login: '🔑',
    logout: '🚪',
    page_view: '👁️',
    profile_update: '✏️',
    settings_change: '⚙️'
  };
  return icons[type] || '📝';
}

function getActivityDescription(activity) {
  const username = activity.user_profiles?.username || 'User';
  const fullName = activity.user_profiles?.full_name || username;

  const descriptions = {
    login: `<strong>${fullName}</strong> logged in`,
    logout: `<strong>${fullName}</strong> logged out`,
    page_view: `<strong>${fullName}</strong> viewed a page`,
    profile_update: `<strong>${fullName}</strong> updated their profile`,
    settings_change: `<strong>${fullName}</strong> changed settings`
  };

  return descriptions[activity.activity_type] || `<strong>${fullName}</strong> performed an action`;
}

export function cleanupDashboard() {
  if (onlineUsersChannel) {
    onlineUsersChannel.unsubscribe();
    onlineUsersChannel = null;
  }
}
