// Venture3 Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded for:', window.location.pathname);
    // Initialize core UI functionality
    createBackground();
    setupGlowEffect();
    setupHeaderScroll();
    setupMobileMenu();
    
    // Authentication and form handling
    setupLoginForms();
    setupPasswordReset();
    setupInvestorSignup();
    handleAuthState();
    setupLogoutHandlers();
    
    // Handle create account link
    const createAccountLink = document.getElementById('create-account');
    const backToLoginLink = document.getElementById('back-to-login');
    const loginForms = document.querySelectorAll('.login-form');

    if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForms.forEach(form => form.classList.remove('active'));
            const registerForm = document.getElementById('register-form');
            if (registerForm) registerForm.classList.add('active');
        });
    }

    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForms.forEach(form => form.classList.remove('active'));
            const loginForm = document.getElementById('email-login');
            if (loginForm) loginForm.classList.add('active');
        });
    }

    // Additional features
    setupStatsCounter();
    setupFundingTrackers();
    setupTalentFilters();
    setupPricingButtons();

    // Load profiles on relevant pages
    if (window.location.pathname.includes('talent-profiles.html')) {
        displayProfiles('talent', '.talent-grid');
    }
    if (window.location.pathname.includes('investors.html')) {
        displayProfiles('investor', '.investors-grid');
        setupInvestorFilters();
        loadInvestors();
    }

    // Project and Investment Handling
    if (window.location.pathname.includes('projects.html')) {
        setupProjectFilters();
        loadProjects();
    }

    // Dashboard Data Loading
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
    }

    // Add List Your Project button functionality
    const listProjectBtn = document.querySelector('.list-project-btn');
    if (listProjectBtn) {
        console.log('List Your Project button found');
        listProjectBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('List Your Project button clicked');
            
            // Only require authentication for actual project creation, not just viewing
            if (window.location.pathname.includes('create-project.html')) {
                const isValidToken = await validateToken();
                if (!isValidToken) {
                    showAlert('Please log in to list a project.', 'error');
                    setTimeout(() => window.location.href = '/login.html', 1500);
                    return;
                }
            }
            
            showAlert('Redirecting to create your project...', 'success');
            setTimeout(() => window.location.href = '/create-project.html', 1000);
        });
    } else {
        console.log('List Your Project button NOT found');
    }

    // Run auth state management
    manageAuthState();

    // Persistent auth state enforcement with diagnostics
    let authAttempts = 0;
    const maxAttempts = 10;
    const authInterval = setInterval(() => {
        if (authAttempts >= maxAttempts) {
            console.warn('Max auth state attempts reached, applying fallback');
            forceUserProfileVisibility();
            clearInterval(authInterval);
            return;
        }
        const success = handleAuthState();
        setupLogoutHandlers();
        console.log(`Auth state retry attempt ${authAttempts + 1}/${maxAttempts}, Success: ${success}`);
        if (success) {
            clearInterval(authInterval);
            console.log('Auth state applied successfully, stopped retries');
        }
        authAttempts++;
    }, 1000);
});

// Force visibility fallback with CSS overrides and click test
function forceUserProfileVisibility() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('Forcing user profile visibility check:', { isLoggedIn, path: window.location.pathname });
    if (!isLoggedIn) return;

    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');

    if (!authButtons || !userProfile) {
        console.error('Fallback failed: Auth elements still not found');
        return;
    }

    console.log('Fallback: Forcing userProfile to show');
    authButtons.style.display = 'none';
    userProfile.style.display = 'flex !important'; // Override CSS
    userProfile.style.visibility = 'visible';
    userProfile.style.opacity = '1';
    userProfile.style.pointerEvents = 'auto'; // Ensure clickable
    if (userName && localStorage.getItem('userName')) {
        userName.textContent = localStorage.getItem('userName');
        console.log('Fallback: Set username to:', userName.textContent);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('Fallback: Logout button found in DOM');
        logoutBtn.style.display = 'block';
        logoutBtn.style.pointerEvents = 'auto';
        // Test clickability
        logoutBtn.addEventListener('click', handleLogoutClick);
    } else {
        console.error('Fallback: Logout button not found in DOM');
    }
}

// Investor Signup Utility (unchanged for brevity)
function setupInvestorSignup() { /* ... */ }

// Profile Management Utilities (unchanged for brevity)
function loadUserProfiles() { /* ... */ }
function displayProfiles(type, containerSelector) { /* ... */ }
function createTalentCard(profile) { /* ... */ }
function createInvestorCard(profile) { /* ... */ }

// Background and UI Utilities (unchanged for brevity)
function createBackground() { /* ... */ }
function setupGlowEffect() { /* ... */ }
function setupHeaderScroll() { /* ... */ }
function setupMobileMenu() { /* ... */ }

// Authentication Utilities
async function validateToken() {
    const token = localStorage.getItem('authToken');
    console.log('Validating token:', token);
    if (!token) {
        console.log('No token found in localStorage');
        return false;
    }

    try {
        const response = await fetch('/api/validate-token', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Token validation response status:', response.status);
        const data = await response.json();
        console.log('Token validation response:', data);
        if (response.status === 401) {
            console.log('Token invalid or expired');
            localStorage.removeItem('authToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            return false;
        }
        if (!response.ok) {
            console.log('Token validation failed with status:', response.status);
            return false;
        }
        console.log('Token validated successfully');
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Updated manageAuthState function to allow access to most pages without login
async function manageAuthState() {
    console.log('Managing auth state for page:', window.location.pathname);
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('authToken');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    console.log('LocalStorage state:', {
        isLoggedIn,
        token,
        userName: localStorage.getItem('userName'),
        userEmail: localStorage.getItem('userEmail')
    });

    // Pages that strictly require authentication
    const strictProtectedPages = ['dashboard.html', 'create-project.html', 'checkout.html'];
    
    // Pages that don't require authentication
    const publicPages = ['index.html', 'signup.html', 'login.html', 'investor-signup.html'];
    
    console.log('Current page:', currentPage, 'Strictly Protected:', strictProtectedPages.includes(currentPage));

    if (isLoggedIn && token) {
        const isValidToken = await validateToken();
        console.log('Token validation result:', isValidToken);
        if (!isValidToken) {
            console.log('Invalid token, clearing localStorage');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            
            // Only redirect from strictly protected pages
            if (strictProtectedPages.includes(currentPage)) {
                showAlert('Your session has expired. Please log in again.', 'info');
                setTimeout(() => window.location.href = '/login.html', 1500);
            }
            return;
        }
        
        // If logged in and on login/signup page, redirect to home
        if (publicPages.includes(currentPage)) {
            console.log('Logged in, redirecting from public page to home');
            window.location.href = '/home.html';
        }
    } else {
        console.log('Not logged in or no token');
        // Only redirect if trying to access strictly protected pages
        if (strictProtectedPages.includes(currentPage)) {
            showAlert('Please log in to access this page.', 'info');
            setTimeout(() => window.location.href = '/login.html', 1500);
        }
    }
}

function handleAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');

    console.log('Handling auth state for:', window.location.pathname, { 
        isLoggedIn, 
        authButtonsExists: !!authButtons, 
        userProfileExists: !!userProfile, 
        userNameExists: !!userName 
    });

    if (!authButtons || !userProfile) {
        console.warn('Auth elements not found in DOM yet');
        return false;
    }

    if (isLoggedIn) {
        console.log('User is logged in, showing userProfile');
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        userProfile.style.visibility = 'visible';
        userProfile.style.opacity = '1';
        userProfile.style.pointerEvents = 'auto'; // Ensure clickable
        
        // Ensure logout button is visible
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.style.visibility = 'visible';
        }
        
        if (userName && localStorage.getItem('userName')) {
            userName.textContent = localStorage.getItem('userName');
            console.log('Set username to:', userName.textContent);
        }
    } else {
        console.log('User is not logged in, showing authButtons');
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
    return true;
}

// Enhanced setupLogoutHandlers function
function setupLogoutHandlers() {
    function attachListeners() {
        const logoutButtons = document.querySelectorAll('#logoutBtn, #logout-btn, .logout-btn');
        console.log('Found logout buttons:', logoutButtons.length);
        
        if (logoutButtons.length === 0) {
            console.warn('No logout buttons found in DOM');
            // Try to find the user profile
            const userProfile = document.getElementById('userProfile');
            if (userProfile && !document.getElementById('logoutBtn')) {
                console.log('Creating logout button dynamically');
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutBtn';
                logoutBtn.className = 'logout-btn';
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                userProfile.appendChild(logoutBtn);
                logoutBtn.addEventListener('click', handleLogoutClick);
            }
        } else {
            logoutButtons.forEach(button => {
                console.log('Attaching listener to logout button:', button.id || button.className);
                button.removeEventListener('click', handleLogoutClick); // Prevent duplicates
                button.addEventListener('click', handleLogoutClick);
            });
        }
    }
    
    attachListeners();
    setTimeout(attachListeners, 500); // Retry after a short delay
}

function handleLogoutClick(e) {
    e.preventDefault();
    console.log('Logout button clicked:', e.target.id || e.currentTarget.id);
    logout();
}

function setupLoginForms() {
    const emailLoginForm = document.getElementById('email-login-form');
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email-input').value.trim();
            const password = document.getElementById('password-input').value;
            if (!email || !isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            if (password.length < 8) {
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }

            const submitBtn = emailLoginForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;

            try {
                await login(email, password);
            } catch (error) {
                console.error('Login error:', error);
                showAlert(error.message || 'Error during login', 'error');
            } finally {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                submitBtn.disabled = false;
            }
        });
    }

    const registerForm = document.getElementById('email-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name-input').value.trim();
            const email = document.getElementById('register-email-input').value.trim();
            const password = document.getElementById('register-password-input').value;
            const confirmPassword = document.getElementById('confirm-password-input').value;

            if (!name) {
                showAlert('Please enter your full name', 'error');
                return;
            }
            if (!isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            if (password.length < 8) {
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            if (!isStrongPassword(password)) {
                showAlert('Password must include uppercase, lowercase, number, and special character', 'error');
                return;
            }

            const userData = { name, email, password, isInvestor: false };
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            try {
                await signup(userData);
                const loginForms = document.querySelectorAll('.login-form');
                loginForms.forEach(form => form.classList.remove('active'));
                const verificationForm = document.getElementById('verification-form');
                if (verificationForm) verificationForm.classList.add('active');
                registerForm.reset();
            } catch (error) {
                console.error('Registration error:', error);
                showAlert(error.message || 'Error during signup', 'error');
            } finally {
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                submitBtn.disabled = false;
            }
        });
    }

    const verificationForm = document.getElementById('email-verification-form');
    if (verificationForm) {
        verificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const verificationInputs = document.querySelectorAll('.verification-input');
            let enteredCode = '';
            verificationInputs.forEach(input => enteredCode += input.value);
            if (enteredCode.length !== 6) {
                showAlert('Please enter the full 6-digit code', 'error');
                return;
            }
            showAlert('Verification form submitted. Please check your email for the verification link.', 'info');
        });
    }
}

function setupPasswordReset() {
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-input');
            const email = emailInput ? emailInput.value.trim() : '';
            if (!email || !isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            showAlert('Password reset instructions sent to your email.', 'success');
        });
    }
}

function setupPricingButtons() {
    const signupButtons = document.querySelectorAll('.signup-btn');
    signupButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const plan = this.getAttribute('data-plan');
            const isValidToken = await validateToken();
            if (!isValidToken) {
                showAlert('Please sign in to subscribe to a plan.', 'info');
                localStorage.setItem('intended_plan', plan); // Save plan for after login
                setTimeout(() => window.location.href = '/login.html', 1500);
                return;
            }
            localStorage.setItem('selected_plan', plan);
            showAlert(`Proceeding to checkout for ${plan.replace('-', ' ')} plan...`, 'success');
            setTimeout(() => window.location.href = '/checkout.html', 1500);
        });
    });
}

// Authentication API Calls
async function login(email, password) {
    try {
        console.log('Login attempt for:', email);
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        console.log('Login successful, token:', data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Check if there was an intended destination
        const intendedPlan = localStorage.getItem('intended_plan');
        if (intendedPlan) {
            localStorage.removeItem('intended_plan');
            localStorage.setItem('selected_plan', intendedPlan);
            window.location.href = '/checkout.html';
            return;
        }
        
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function signup(userData) {
    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Signup failed');
    showAlert(data.message, 'success');
}

function logout() {
    console.log('Executing logout function');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    showAlert('Logged out successfully', 'success');
    window.location.href = '/index.html';
}

// Validation Helpers
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function isStrongPassword(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Alert Utility
function showAlert(message, type = 'success', duration = 5000) {
    let alertEl = document.querySelector('.custom-alert');
    if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.className = 'custom-alert';
        document.body.appendChild(alertEl);
    }
    alertEl.className = `custom-alert ${type}`;
    alertEl.textContent = message;
    alertEl.classList.add('show');
    setTimeout(() => alertEl.classList.remove('show'), duration);
}

// Stats and Project Tracking (unchanged for brevity)
function setupStatsCounter() { /* ... */ }
function setupFundingTrackers() { /* ... */ }
function simulateFundingIncrease(card, projectIndex) { /* ... */ }
function updateFundingUI(card, currentFunding, targetFunding) { /* ... */ }

// Talent Filters Utility (unchanged for brevity)
function setupTalentFilters() { /* ... */ }

// Project and Investment Management (unchanged for brevity)
function loadProjects() { /* ... */ }
function createProjectCard(project) { /* ... */ }
function setupInvestmentForms() { /* ... */ }
function setupProjectFilters() { /* ... */ }

// Investor Management (unchanged for brevity)
function loadInvestors() { /* ... */ }
function setupInvestorFilters() { /* ... */ }

// Dashboard Management (unchanged for brevity)
function loadDashboardData() { /* ... */ }
function updatePortfolioOverview(investments) { /* ... */ }

// Wallet Detection Utility (unchanged for brevity)
function detectAvailableWallets() { /* ... */ }

// Initialize wallet detection
detectAvailableWallets();