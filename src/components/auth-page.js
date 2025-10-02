import { signIn, signUp } from '../auth.js';

export function createAuthPage() {
  const container = document.createElement('div');
  container.className = 'auth-container';
  container.id = 'auth-page';

  container.innerHTML = `
    <div class="auth-card">
      <div class="auth-header">
        <h1>🔐 Welcome</h1>
        <p id="auth-subtitle">Sign in to access your dashboard</p>
      </div>

      <div id="auth-error" class="error-message" style="display: none;">
        <span>⚠️</span>
        <span id="error-text"></span>
      </div>

      <div id="auth-success" class="success-message" style="display: none;">
        <span>✓</span>
        <span id="success-text"></span>
      </div>

      <form id="auth-form">
        <div class="form-group" id="username-group" style="display: none;">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            class="form-input"
            placeholder="Enter your username"
          />
        </div>

        <div class="form-group" id="fullname-group" style="display: none;">
          <label for="fullname">Full Name</label>
          <input
            type="text"
            id="fullname"
            class="form-input"
            placeholder="Enter your full name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            class="form-input"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            class="form-input"
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" id="submit-btn">
          <span id="btn-text">Sign In</span>
        </button>
      </form>

      <div class="auth-footer">
        <p id="toggle-text">
          Don't have an account?
          <a href="#" id="toggle-mode">Sign up</a>
        </p>
      </div>
    </div>
  `;

  let isSignUp = false;

  const form = container.querySelector('#auth-form');
  const toggleMode = container.querySelector('#toggle-mode');
  const usernameGroup = container.querySelector('#username-group');
  const fullnameGroup = container.querySelector('#fullname-group');
  const authSubtitle = container.querySelector('#auth-subtitle');
  const btnText = container.querySelector('#btn-text');
  const toggleText = container.querySelector('#toggle-text');
  const errorDiv = container.querySelector('#auth-error');
  const successDiv = container.querySelector('#auth-success');
  const errorText = container.querySelector('#error-text');
  const successText = container.querySelector('#success-text');

  toggleMode.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;

    if (isSignUp) {
      usernameGroup.style.display = 'block';
      fullnameGroup.style.display = 'block';
      authSubtitle.textContent = 'Create your account';
      btnText.textContent = 'Sign Up';
      toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-mode">Sign in</a>';
    } else {
      usernameGroup.style.display = 'none';
      fullnameGroup.style.display = 'none';
      authSubtitle.textContent = 'Sign in to access your dashboard';
      btnText.textContent = 'Sign In';
      toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-mode">Sign up</a>';
    }

    container.querySelector('#toggle-mode').addEventListener('click', (e) => {
      e.preventDefault();
      toggleMode.click();
    });

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = container.querySelector('#email').value;
    const password = container.querySelector('#password').value;
    const username = container.querySelector('#username').value;
    const fullname = container.querySelector('#fullname').value;
    const submitBtn = container.querySelector('#submit-btn');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    submitBtn.disabled = true;
    btnText.innerHTML = '<span class="loading"></span> Processing...';

    try {
      if (isSignUp) {
        if (!username) {
          throw new Error('Username is required');
        }
        await signUp(email, password, username, fullname || username);
        successText.textContent = 'Account created! Please sign in.';
        successDiv.style.display = 'flex';

        setTimeout(() => {
          toggleMode.click();
          form.reset();
        }, 2000);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      errorText.textContent = error.message;
      errorDiv.style.display = 'flex';
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  });

  return container;
}
