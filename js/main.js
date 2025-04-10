// Venture3 Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functionality
    createBackground();
    setupGlowEffect();
    setupHeaderScroll();
    setupMobileMenu();
    
    // Authentication and form handling
    setupLoginForms();
    setupPasswordReset();
    setupInvestorSignup();

    // Handle create account link
    const createAccountLink = document.getElementById('create-account');
    const backToLoginLink = document.getElementById('back-to-login');
    const loginForms = document.querySelectorAll('.login-form');

    if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForms.forEach(form => form.classList.remove('active'));
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.classList.add('active');
            }
        });
    }

    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForms.forEach(form => form.classList.remove('active'));
            const loginForm = document.getElementById('email-login');
            if (loginForm) {
                loginForm.classList.add('active');
            }
        });
    }

    setupLogoutHandlers();
    preventAuthenticatedAccess();
    checkSessionExpiration();
    
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
        console.log('List Your Project button found'); // Debug log
        listProjectBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior
            console.log('List Your Project button clicked'); // Debug log
            showAlert('Redirecting to create your project...', 'success');
            setTimeout(() => {
                window.location.href = 'create-project.html';
            }, 1000);
        });
    } else {
        console.log('List Your Project button NOT found'); // Debug log
    }
});

// Investor Signup Utility (unchanged)
function setupInvestorSignup() {
    const signupForm = document.getElementById('investor-signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('investor-name').value.trim();
            const email = document.getElementById('investor-email').value.trim();
            const password = document.getElementById('investor-password').value;
            const confirmPassword = document.getElementById('investor-confirm-password').value;
            const investorType = document.getElementById('investor-type').value;
            const investmentFocus = document.getElementById('investor-focus').value.trim();

            if (!name || !email || !password || !confirmPassword || !investorType || !investmentFocus) {
                showAlert('Please fill in all fields', 'error');
                return;
            }
            if (!isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            if (password.length < 8 || !isStrongPassword(password)) {
                showAlert('Password must be 8+ characters with uppercase, lowercase, number, and special character', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }

            const userData = {
                name,
                email,
                investorType,
                investmentFocus,
                lastLogin: new Date().toISOString(),
                isInvestor: true
            };
            localStorage.setItem('venture3_user', JSON.stringify(userData));

            showAlert('Sign up successful! Redirecting to profile creation...', 'success');
            setTimeout(() => {
                window.location.href = 'create-profile.html';
            }, 1500);
        });
    }
}

// Profile Management Utilities (unchanged)
function loadUserProfiles() {
    const profiles = JSON.parse(localStorage.getItem('venture3_profiles') || '[]');
    return profiles;
}

function displayProfiles(type, containerSelector) {
    const profiles = loadUserProfiles().filter(profile => profile.type === type);
    const container = document.querySelector(containerSelector);
    if (!container) return;

    profiles.forEach(profile => {
        const card = type === 'talent' ? createTalentCard(profile) : createInvestorCard(profile);
        container.appendChild(card);
    });
}

function createTalentCard(profile) {
    const card = document.createElement('div');
    card.className = 'talent-card';
    card.innerHTML = `
        <div class="talent-avatar">
            <img src="${profile.avatar}" alt="${profile.name}">
        </div>
        <h3 class="talent-name">${profile.name}</h3>
        <p class="talent-role">${profile.role}</p>
        <div class="talent-skills">
            ${profile.skills.map(skill => `<span>${skill}</span>`).join('')}
        </div>
        <p class="talent-bio">${profile.bio}</p>
        <div class="talent-stats">
            <span><i class="fas fa-star"></i> 4.5 Rating</span>
            <span><i class="fas fa-briefcase"></i> 0 Projects</span>
        </div>
        <div class="talent-actions">
            <a href="#" class="connect-btn"><i class="fas fa-envelope"></i> Connect</a>
            <a href="#" class="view-profile-btn">View Profile</a>
        </div>
    `;
    return card;
}

function createInvestorCard(profile) {
    const card = document.createElement('div');
    card.className = 'investor-card';
    card.innerHTML = `
        <div class="investor-logo"></div>
        <h3>${profile.name}</h3>
        <div class="investor-type">${profile.role}</div>
        <div class="investor-details">
            <p><strong>Interests:</strong> ${profile.skills.join(', ')}</p>
            <p><strong>Availability:</strong> ${profile.availability}</p>
        </div>
        <div class="investor-actions">
            <a href="#" class="contact-btn">Contact</a>
            <a href="#" class="view-profile-btn">View Profile</a>
        </div>
    `;
    return card;
}

// Background and UI Utilities (unchanged)
function createBackground() {
    const background = document.getElementById('background');
    
    if (!background) return;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = Math.random() * 8 + 4 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        particle.style.opacity = Math.random() * 0.3;
        particle.style.animationDuration = Math.random() * 20 + 10 + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        background.appendChild(particle);
    }
    
    for (let i = 0; i < 8; i++) {
        const hexagon = document.createElement('div');
        hexagon.classList.add('hexagon');
        hexagon.style.width = Math.random() * 200 + 100 + 'px';
        hexagon.style.height = hexagon.style.width;
        hexagon.style.left = Math.random() * 100 + 'vw';
        hexagon.style.top = Math.random() * 100 + 'vh';
        hexagon.style.opacity = Math.random() * 0.1 + 0.05;
        hexagon.style.animationDuration = Math.random() * 30 + 20 + 's';
        background.appendChild(hexagon);
    }
    
    for (let i = 0; i < 10; i++) {
        const gridLine = document.createElement('div');
        gridLine.classList.add('grid-line');
        gridLine.style.top = Math.random() * 100 + 'vh';
        gridLine.style.opacity = Math.random() * 0.1 + 0.05;
        background.appendChild(gridLine);
    }
}

function setupGlowEffect() {
    const glowEl = document.querySelector('.glow-effect');
    
    if (!glowEl) return;
    
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        glowEl.style.left = `${x - 150}px`;
        glowEl.style.top = `${y - 150}px`;
    });
}

function setupHeaderScroll() {
    const header = document.getElementById('header');
    
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (!menuBtn || !navMenu) return;
    
    menuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Authentication Utilities (unchanged)
function setupLoginForms() {
    const emailLoginForm = document.getElementById('email-login-form');
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', (e) => {
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
            
            setTimeout(() => {
                const userData = {
                    email: email,
                    name: email.split('@')[0],
                    lastLogin: new Date().toISOString()
                };
                
                localStorage.setItem('venture3_user', JSON.stringify(userData));
                
                showAlert('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            }, 1500);
        });
    }
    
    const registerForm = document.getElementById('email-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
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
            
            const pendingUserData = {
                name: name,
                email: email,
                verificationCode: generateVerificationCode(),
                registeredAt: new Date().toISOString()
            };
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                localStorage.setItem('venture3_pending_user', JSON.stringify(pendingUserData));
                
                showAlert(`Verification code sent to ${email}`, 'success');
                console.log('Verification Code:', pendingUserData.verificationCode);
                
                const loginForms = document.querySelectorAll('.login-form');
                loginForms.forEach(form => form.classList.remove('active'));
                
                const verificationForm = document.getElementById('verification-form');
                if (verificationForm) {
                    verificationForm.classList.add('active');
                }
                
                registerForm.reset();
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                submitBtn.disabled = false;
            }, 1500);
        });
    }
    
    const verificationForm = document.getElementById('email-verification-form');
    if (verificationForm) {
        verificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const verificationInputs = document.querySelectorAll('.verification-input');
            let enteredCode = '';
            verificationInputs.forEach(input => {
                enteredCode += input.value;
            });
            
            if (enteredCode.length !== 6) {
                showAlert('Please enter the full 6-digit code', 'error');
                return;
            }
            
            const pendingUserDataStr = localStorage.getItem('venture3_pending_user');
            if (!pendingUserDataStr) {
                showAlert('Registration session expired. Please register again.', 'error');
                return;
            }
            
            const pendingUserData = JSON.parse(pendingUserDataStr);
            
            const submitBtn = verificationForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                if (enteredCode === pendingUserData.verificationCode) {
                    const verifiedUserData = {
                        name: pendingUserData.name,
                        email: pendingUserData.email,
                        lastLogin: new Date().toISOString()
                    };
                    
                    localStorage.setItem('venture3_user', JSON.stringify(verifiedUserData));
                    localStorage.removeItem('venture3_pending_user');
                    
                    showAlert('Account verified successfully!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'home.html';
                    }, 1500);
                } else {
                    showAlert('Invalid verification code. Please try again.', 'error');
                    
                    verificationInputs.forEach(input => {
                        input.value = '';
                    });
                    verificationInputs[0].focus();
                    
                    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Account';
                    submitBtn.disabled = false;
                }
            }, 1500);
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

function setupLogoutHandlers() {
    const logoutButtons = document.querySelectorAll('.logout-btn, #logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            localStorage.removeItem('venture3_user');
            
            showAlert('You have been logged out successfully.', 'info');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    });
}

function preventAuthenticatedAccess() {
    const userData = localStorage.getItem('venture3_user');
    const currentPage = window.location.pathname.split('/').pop();
    
    const publicPages = ['index.html', 'signup.html', 'login.html'];
    const protectedPages = ['home.html', 'dashboard.html', 'projects.html', 'investors.html', 'talent-profiles.html', 'pricing.html', 'checkout.html'];
    
    if (userData) {
        if (publicPages.includes(currentPage)) {
            window.location.href = 'home.html';
        }
    } else {
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    }
}

function checkSessionExpiration() {
    const userData = localStorage.getItem('venture3_user');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const lastLogin = new Date(user.lastLogin);
            const currentTime = new Date();
            
            const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            
            if (currentTime - lastLogin > sessionDuration) {
                localStorage.removeItem('venture3_user');
                showAlert('Your session has expired. Please log in again.', 'info');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking session:', error);
            localStorage.removeItem('venture3_user');
        }
    }
}

// Pricing Buttons Utility (unchanged)
function setupPricingButtons() {
    const signupButtons = document.querySelectorAll('.signup-btn');
    signupButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.getAttribute('data-plan');
            const userData = localStorage.getItem('venture3_user');
            
            if (!userData) {
                showAlert('Please sign in first', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                return;
            }

            localStorage.setItem('selected_plan', plan);
            showAlert(`Proceeding to checkout for ${plan.replace('-', ' ')} plan...`, 'success');
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 1500);
        });
    });
}

// Validation Helpers (unchanged)
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

// Alert Utility (unchanged)
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
    
    setTimeout(() => {
        alertEl.classList.remove('show');
    }, duration);
}

// Stats and Project Tracking (unchanged)
function setupStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    
    if (stats.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const countTo = target.getAttribute('data-count');
                
                if (!countTo) return;
                
                let startValue = 0;
                let endValue = parseInt(countTo);
                let duration = 2000;
                let startTime = null;
                
                function animate(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const progress = timestamp - startTime;
                    const percentage = Math.min(progress / duration, 1);
                    
                    let currentValue = Math.floor(percentage * endValue);
                    
                    if (target.textContent.includes('$')) {
                        target.textContent = '$' + currentValue + 'M+';
                    } else if (target.textContent.includes('+')) {
                        target.textContent = currentValue + '+';
                    } else {
                        target.textContent = currentValue;
                    }
                    
                    if (percentage < 1) {
                        requestAnimationFrame(animate);
                    }
                }
                
                requestAnimationFrame(animate);
                observer.unobserve(target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    stats.forEach(stat => {
        observer.observe(stat);
    });
}

function setupFundingTrackers() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach((card, index) => {
        const progressBar = card.querySelector('.progress-bar');
        const fundingInfo = card.querySelector('.funding-info');
        
        if (!progressBar || !fundingInfo) return;
        
        const spans = fundingInfo.querySelectorAll('span');
        if (spans.length < 2) return;
        
        const targetText = spans[0].textContent.split('/')[1].trim();
        const targetAmount = parseFloat(targetText.replace('$', '').replace('M', '')) * 1000000;
        
        card.dataset.currentFunding = 0;
        card.dataset.targetFunding = targetAmount;
        
        simulateFundingIncrease(card, index);
    });
}

function simulateFundingIncrease(card, projectIndex) {
    const interval = 5000 + (projectIndex * 2000);
    
    setInterval(() => {
        let currentFunding = parseFloat(card.dataset.currentFunding);
        const targetFunding = parseFloat(card.dataset.targetFunding);
        
        const increase = Math.random() * (10000 / (projectIndex + 1));
        currentFunding += increase;
        
        if (currentFunding > targetFunding) {
            currentFunding = targetFunding;
        }
        
        card.dataset.currentFunding = currentFunding;
        
        updateFundingUI(card, currentFunding, targetFunding);
    }, interval);
}

function updateFundingUI(card, currentFunding, targetFunding) {
    const progressBar = card.querySelector('.progress-bar');
    const fundingInfo = card.querySelector('.funding-info');
    
    if (!progressBar || !fundingInfo) return;
    
    const spans = fundingInfo.querySelectorAll('span');
    if (spans.length < 2) return;
    
    const percentage = (currentFunding / targetFunding) * 100;
    
    progressBar.style.width = `${percentage}%`;
    
    let displayAmount;
    if (currentFunding >= 1000000) {
        displayAmount = `$${(currentFunding / 1000000).toFixed(2)}M`;
    } else if (currentFunding >= 1000) {
        displayAmount = `$${(currentFunding / 1000).toFixed(2)}K`;
    } else {
        displayAmount = `$${currentFunding.toFixed(2)}`;
    }
    
    const targetText = targetFunding >= 1000000 
        ? `$${(targetFunding / 1000000).toFixed(0)}M` 
        : `$${targetFunding}`;
    
    spans[0].textContent = `${displayAmount} / ${targetText}`;
    spans[1].textContent = `${percentage.toFixed(1)}% Funded`;
}

// Talent Filters Utility (unchanged)
function setupTalentFilters() {
    const skillFilter = document.getElementById('skill-filter');
    const roleFilter = document.getElementById('role-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const talentCards = document.querySelectorAll('.talent-card');

    if (!skillFilter || !roleFilter || !availabilityFilter) return;

    function filterProfiles() {
        const skillValue = skillFilter.value;
        const roleValue = roleFilter.value;
        const availabilityValue = availabilityFilter.value;

        talentCards.forEach(card => {
            const skills = Array.from(card.querySelector('.talent-skills').children).map(span => span.textContent.toLowerCase());
            const role = card.querySelector('.talent-role').textContent.toLowerCase();
            const bio = card.querySelector('.talent-bio').textContent.toLowerCase();

            const skillMatch = !skillValue || skills.includes(skillValue.toLowerCase());
            const roleMatch = !roleValue || role.includes(roleValue.toLowerCase());
            const availabilityMatch = !availabilityValue || bio.includes(availabilityValue.toLowerCase());

            card.style.display = (skillMatch && roleMatch && availabilityMatch) ? 'block' : 'none';
        });
    }

    skillFilter.addEventListener('change', filterProfiles);
    roleFilter.addEventListener('change', filterProfiles);
    availabilityFilter.addEventListener('change', filterProfiles);
}

// Project and Investment Management (unchanged)
function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('venture3_projects') || '[]');
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    grid.innerHTML = '';
    projects.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
    });

    setupInvestmentForms();
}

function createProjectCard(project) {
    const raised = project.raised || 0;
    const goal = project.fundingGoal;
    const percentage = (raised / goal) * 100;

    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-logo"></div>
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <div class="project-details">
            <p><strong>Technology:</strong> ${project.technology}</p>
            <p><strong>Tokenomics:</strong> ${project.tokenomics}</p>
            <p><strong>Team:</strong> ${project.team}</p>
            <p><strong>Roadmap:</strong> ${project.roadmap}</p>
            <p><strong>Stage:</strong> ${project.stage || 'Seed'}</p>
        </div>
        <div class="project-tags">
            ${project.sector ? `<span>${project.sector}</span>` : ''}
        </div>
        <div class="project-funding">
            <div class="funding-progress">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="funding-info">
                <span>$${raised.toLocaleString()} / $${goal.toLocaleString()}</span>
                <span>${percentage.toFixed(1)}% Funded</span>
            </div>
        </div>
        <form class="invest-form">
            <input type="number" placeholder="Investment Amount ($)" min="10000" data-project="${project.name}">
            <button type="submit" class="primary-btn invest-btn">Invest Now</button>
        </form>
    `;
    return card;
}

function setupInvestmentForms() {
    const forms = document.querySelectorAll('.invest-form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const amount = parseInt(this.querySelector('input').value);
            const projectName = this.querySelector('input').dataset.project;
            const userData = JSON.parse(localStorage.getItem('venture3_user'));

            if (!amount || amount < 10000) {
                showAlert('Minimum investment is $10,000', 'error');
                return;
            }

            localStorage.setItem('investment_data', JSON.stringify({ project: projectName, amount }));
            showAlert('Proceeding to investment checkout...', 'success');
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 1500);
        });
    });
}

function setupProjectFilters() {
    const sectorFilter = document.getElementById('sector-filter');
    const stageFilter = document.getElementById('stage-filter');
    const minInvestment = document.getElementById('min-investment');

    if (!sectorFilter || !stageFilter || !minInvestment) return;

    function filterProjects() {
        const sector = sectorFilter.value;
        const stage = stageFilter.value;
        const min = parseInt(minInvestment.value) || 0;
        const projects = JSON.parse(localStorage.getItem('venture3_projects') || '[]');
        const filtered = projects.filter(p => 
            (!sector || p.sector === sector) &&
            (!stage || p.stage === stage) &&
            (p.minInvestment >= min)
        );
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';
        filtered.forEach(p => grid.appendChild(createProjectCard(p)));
        setupInvestmentForms();
    }

    sectorFilter.addEventListener('change', filterProjects);
    stageFilter.addEventListener('change', filterProjects);
    minInvestment.addEventListener('change', filterProjects);
}

// Investor Management (unchanged)
function loadInvestors() {
    const investors = JSON.parse(localStorage.getItem('venture3_investors') || '[]');
    const grid = document.getElementById('investors-grid');
    if (!grid) return;

    grid.innerHTML = '';
    investors.forEach(investor => {
        const card = createInvestorCard(investor);
        grid.appendChild(card);
    });
}

function setupInvestorFilters() {
    const focusFilter = document.getElementById('investment-focus');
    const typeFilter = document.getElementById('investor-type');
    const minTicket = document.getElementById('min-ticket');

    if (!focusFilter || !typeFilter || !minTicket) return;

    function filterInvestors() {
        const focus = focusFilter.value;
        const type = typeFilter.value;
        const min = parseInt(minTicket.value) || 0;
        const investors = JSON.parse(localStorage.getItem('venture3_investors') || '[]');
        const filtered = investors.filter(i => 
            (!focus || i.investmentFocus.includes(focus)) &&
            (!type || i.investorType === type) &&
            (i.minTicket >= min)
        );
        const grid = document.getElementById('investors-grid');
        grid.innerHTML = '';
        filtered.forEach(i => grid.appendChild(createInvestorCard(i)));
    }

    focusFilter.addEventListener('change', filterInvestors);
    typeFilter.addEventListener('change', filterInvestors);
    minTicket.addEventListener('change', filterInvestors);
}

// Dashboard Management
function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('venture3_user'));
    if (!user) {
        showAlert('Please log in to access your dashboard', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    const investments = JSON.parse(localStorage.getItem(`investments_${user.email}`) || '[]');
    updatePortfolioOverview(investments);
}

function updatePortfolioOverview(investments) {
    const overviewGrid = document.getElementById('portfolio-overview');
    if (!overviewGrid) return;

    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const fundsRaised = investments.reduce((sum, inv) => sum + (inv.fundsRaised || 0), 0);
    const currentValue = investments.reduce((sum, inv) => sum + (inv.current || inv.invested), 0);
    const roi = totalInvested ? (((currentValue - totalInvested) / totalInvested) * 100).toFixed(2) : 0;

    overviewGrid.innerHTML = `
        <div class="overview-card">
            <i class="fas fa-wallet"></i>
            <h3>Total Investments</h3>
            <div class="value">$${totalInvested.toLocaleString()}</div>
        </div>
        <div class="overview-card">
            <i class="fas fa-coins"></i>
            <h3>Funds Raised</h3>
            <div class="value">$${fundsRaised.toLocaleString()}</div>
        </div>
        <div class="overview-card">
            <i class="fas fa-chart-line"></i>
            <h3>Current Value</h3>
            <div class="value">$${currentValue.toLocaleString()}</div>
        </div>
        <div class="overview-card">
            <i class="fas fa-percentage"></i>
            <h3>ROI</h3>
            <div class="value ${roi >= 0 ? 'positive' : 'negative'}">${roi}%</div>
        </div>
    `;
}

// Wallet Detection Utility (unchanged)
function detectAvailableWallets() {
    window.addEventListener('load', function() {
        window.walletAvailability = {
            metamask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
            coinbase: typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
            phantom: typeof window.solana !== 'undefined',
            uniswap: false
        };
        
        console.log("Wallet availability:", window.walletAvailability);
    });
}

// Initialize wallet detection
detectAvailableWallets();