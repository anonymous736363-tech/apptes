import './styles/main.css';
import { createAuthPage } from './components/auth-page.js';
import { createDashboard, cleanupDashboard } from './components/dashboard.js';
import { getCurrentUser, onAuthStateChanged } from './auth.js';

let currentPage = null;

async function init() {
  const app = document.querySelector('#app');

  try {
    const user = await getCurrentUser();

    if (user && user.profile) {
      showDashboard(app, user);
    } else {
      showAuthPage(app);
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    showAuthPage(app);
  }

  onAuthStateChanged(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const user = await getCurrentUser();
      if (user && user.profile) {
        showDashboard(app, user);
      }
    } else if (event === 'SIGNED_OUT') {
      showAuthPage(app);
    }
  });
}

function showAuthPage(app) {
  if (currentPage) {
    cleanupDashboard();
    currentPage.remove();
  }

  currentPage = createAuthPage();
  app.innerHTML = '';
  app.appendChild(currentPage);
}

function showDashboard(app, user) {
  if (currentPage) {
    currentPage.remove();
  }

  currentPage = createDashboard(user);
  app.innerHTML = '';
  app.appendChild(currentPage);
}

init();
