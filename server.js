require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = express();

// CORS middleware - allow all origins in development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow any origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'venture33_secret_token_key';

// Configure email transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Use the App Password you generated
  }
});

// Verify email transport on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection established, ready to send emails');
  }
});

// Path to store user data
const USER_DATA_FILE = path.join(__dirname, 'users.json');

// Load existing users from file
let users = [];
try {
  if (fs.existsSync(USER_DATA_FILE)) {
    const userData = fs.readFileSync(USER_DATA_FILE, 'utf8');
    users = JSON.parse(userData);
    console.log(`Loaded ${users.length} users from storage`);
  }
} catch (error) {
  console.error('Error loading user data:', error);
}

// Function to save users to file
function saveUsers() {
  try {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(users, null, 2));
    console.log(`Saved ${users.length} users to storage`);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  // Get token from headers or query parameters
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(user => user.email === decoded.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.verified) {
      return res.status(403).json({ message: 'Email not verified' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Creates HTML with consistent header and footer for any page
 * @param {string} title - Page title
 * @param {string} content - Main content HTML
 * @param {Object} options - Additional options
 * @returns {string} Full HTML with consistent header and footer
 */
function renderWithLayout(title, content, options = {}) {
  // Set default options
  const opts = {
    additionalStyles: '',
    additionalScripts: '',
    additionalHeadContent: '',
    ...options
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Venture3</title>
        <link rel="stylesheet" href="/css/styles.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        ${opts.additionalHeadContent}
        <style>
            ${opts.additionalStyles}
        </style>
    </head>
    <body>
        <!-- Live Background -->
        <div class="background" id="background"></div>
        
        <!-- Glow Effect -->
        <div class="glow-effect"></div>
        
        <!-- Header -->
        <header id="header">
            <div class="logo">
                <i class="fas fa-cubes"></i>
                Venture<span class="highlight">3</span>
            </div>
            <nav>
                <button class="menu-btn" id="menuBtn"><i class="fas fa-bars"></i></button>
                <ul id="navMenu">
                    <li><a href="/home.html" id="nav-home">Home</a></li>
                    <li><a href="/projects.html" id="nav-projects">Projects</a></li>
                    <li><a href="/investors.html" id="nav-investors">Investors</a></li>
                    <li><a href="/talent-profiles.html" id="nav-talent">Talent</a></li>
                    <li><a href="/learn.html" id="nav-learn">Learn</a></li>
                    <li><a href="/pricing.html" id="nav-pricing">Pricing</a></li>
                    <li><a href="/dashboard.html" id="nav-dashboard">Dashboard</a></li>
                </ul>
            </nav>
            <div class="auth-buttons" id="authButtons">
                <a href="/login.html" class="connect-btn" id="loginBtn">
                    <i class="fas fa-sign-in-alt"></i> Login
                </a>
                <a href="/signup.html" class="list-project-btn" id="signupBtn">
                    <i class="fas fa-user-plus"></i> Sign Up
                </a>
            </div>
            
            <!-- User profile will be displayed when logged in (initially hidden) -->
            <div class="user-profile" id="userProfile" style="display: none;">
                <span class="user-name" id="userName">User</span>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>

        <!-- Main Content -->
        ${content}
      
        <!-- Footer -->
        <footer>
            <div class="copyright">
                © 2025 Venture3. All rights reserved.
            </div>
        </footer>
      
        <script>
        // Function to add animated background particles
        function createBackgroundEffects() {
            const background = document.getElementById('background');
            if (!background) return;
            
            // Create particles
            for (let i = 0; i < 20; i++) {
                createParticle();
                if (i % 2 === 0) createHexagon();
            }
            
            function createParticle() {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                particle.style.width = Math.random() * 5 + 2 + 'px';
                particle.style.height = particle.style.width;
                particle.style.left = Math.random() * 100 + 'vw';
                particle.style.top = Math.random() * 100 + 'vh';
                particle.style.animationDuration = Math.random() * 20 + 10 + 's';
                particle.style.animationDelay = Math.random() * 5 + 's';
                background.appendChild(particle);
            }
            
            function createHexagon() {
                const hexagon = document.createElement('div');
                hexagon.classList.add('hexagon');
                hexagon.style.width = Math.random() * 100 + 50 + 'px';
                hexagon.style.height = hexagon.style.width;
                hexagon.style.left = Math.random() * 100 + 'vw';
                hexagon.style.top = Math.random() * 100 + 'vh';
                hexagon.style.animationDuration = Math.random() * 30 + 20 + 's';
                hexagon.style.animationDelay = Math.random() * 5 + 's';
                background.appendChild(hexagon);
            }
        }

        // Function to handle navigation highlighting
        function setupNavigation() {
            // Get current page path
            const currentPath = window.location.pathname;
            
            // Highlight current nav item
            const navLinks = document.querySelectorAll('#navMenu a');
            navLinks.forEach(link => {
                // Remove all active classes first
                link.classList.remove('active');
                
                // Check if the link href matches the current path
                const href = link.getAttribute('href');
                if (href && currentPath.includes(href)) {
                    link.classList.add('active');
                }
            });
            
            // Handle specific cases like root path or index
            if (currentPath === '/' || currentPath.includes('index.html')) {
                const homeLink = document.getElementById('nav-home');
                if (homeLink) homeLink.classList.add('active');
            }
            
            // Mobile menu toggle
            const menuBtn = document.getElementById('menuBtn');
            const navMenu = document.getElementById('navMenu');
            
            if (menuBtn && navMenu) {
                menuBtn.addEventListener('click', () => {
                    navMenu.classList.toggle('active');
                });
                
                // Close menu when clicking outside
                document.addEventListener('click', (event) => {
                    if (navMenu.classList.contains('active') && 
                        !event.target.closest('#navMenu') && 
                        !event.target.closest('#menuBtn')) {
                        navMenu.classList.remove('active');
                    }
                });
            }
        }

        // Function to handle authentication state
        function handleAuthState() {
            // Check if user is logged in (via localStorage or cookie)
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const authButtons = document.getElementById('authButtons');
            const userProfile = document.getElementById('userProfile');
            const userName = document.getElementById('userName');
            
            if (isLoggedIn && authButtons && userProfile) {
                // Show user profile instead of auth buttons
                authButtons.style.display = 'none';
                userProfile.style.display = 'flex';
                
                // Get user name from localStorage
                const name = localStorage.getItem('userName');
                if (name && userName) {
                    userName.textContent = name;
                }
                
                // Add logout functionality
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        // Clear user data
                        localStorage.removeItem('isLoggedIn');
                        localStorage.removeItem('userName');
                        localStorage.removeItem('token');
                        
                        // Redirect to home page
                        window.location.href = '/';
                    });
                }
            }
        }

        // Function to handle header scroll effect
        function handleHeaderScroll() {
            const header = document.getElementById('header');
            if (header) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                });
            }
        }

        // Move glow effect with mouse
        function handleGlowEffect() {
            const glowEffect = document.querySelector('.glow-effect');
            if (glowEffect) {
                document.addEventListener('mousemove', (e) => {
                    glowEffect.style.left = e.clientX + 'px';
                    glowEffect.style.top = e.clientY + 'px';
                });
            }
        }

        // Initialize all common functionality
        document.addEventListener('DOMContentLoaded', function() {
            createBackgroundEffects();
            setupNavigation();
            handleAuthState();
            handleHeaderScroll();
            handleGlowEffect();
        });
        </script>
        
        ${opts.additionalScripts}
    </body>
    </html>
  `;
}

// Add user with auto-verification (for testing)
app.get('/api/add-test-user', (req, res) => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    verified: true,
    token: 'test-token',
    isInvestor: true,
    createdAt: new Date().toISOString()
  };
  
  // Check if user already exists
  const existingUserIndex = users.findIndex(u => u.email === testUser.email);
  if (existingUserIndex !== -1) {
    users[existingUserIndex] = testUser; // Replace existing user
  } else {
    users.push(testUser); // Add new user
  }
  
  saveUsers();
  res.json({ message: 'Test user created', user: testUser });
});

// Signup route
app.post('/api/signup', async (req, res) => {
  const { name, email, password, investorType, investmentFocus, isInvestor } = req.body;
  
  console.log('Signup request received:', { name, email, investorType });
  
  // Check if user already exists
  if (users.find(user => user.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create verification token
  const token = jwt.sign(
    { email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  // Add user to in-memory storage (not verified initially)
  users.push({
    name,
    email,
    password,
    verified: false, // Not verified until email confirmation
    token,
    investorType,
    investmentFocus,
    isInvestor: isInvestor || false,
    createdAt: new Date().toISOString()
  });
  
  // Save users to file
  saveUsers();
  
  console.log('User added:', users[users.length-1].email);
  
  // Set up verification URL - using direct route instead of HTML file
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  try {
    // Send verification email
    await transporter.sendMail({
      from: `"Venture3" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email for Venture3',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff0080;">Welcome to Venture3!</h1>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <p>Hello ${name},</p>
            <p>Thank you for joining Venture3, the premier platform connecting innovative blockchain projects with crypto investors.</p>
            <p>Please click the button below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #ff0080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #ff0080;"><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p>This link will expire in 24 hours.</p>
          </div>
          
          <div style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            <p>If you did not create an account with Venture3, please ignore this email.</p>
            <p>&copy; 2025 Venture3. All rights reserved.</p>
          </div>
        </div>
      `
    });
    
    console.log('Verification email sent to:', email);
    
    res.status(201).json({ 
      message: 'User registered successfully! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // If email fails, provide error but keep user in system
    res.status(201).json({ 
      message: 'User registered successfully, but there was an issue sending the verification email. Please use the resend verification option.',
      emailFailed: true,
      email
    });
  }
});

// Verification route - with consistent header
app.get('/verify-email', (req, res) => {
  const { token } = req.query;
  
  console.log('Verification request received for token:', token);
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIndex = users.findIndex(user => user.email === decoded.email);
    
    if (userIndex === -1) {
      console.log('User not found for verification');
      
      // Error page for user not found with consistent header
      const errorContent = `
        <div class="verification-container">
          <div class="verification-card">
            <div class="verification-icon error">
              <i class="fas fa-times-circle"></i>
            </div>
            <h1>Verification Failed</h1>
            <p>User not found or verification link is invalid.</p>
            <div class="verification-actions">
              <a href="/" class="btn-outline">Return to Homepage</a>
            </div>
          </div>
        </div>
      `;
      
      return res.send(renderWithLayout('Verification Failed', errorContent, {
        additionalStyles: `
          .verification-container {
            max-width: 600px;
            margin: 0 auto;
            padding-top: calc(var(--header-height) + 2 * var(--space-sm) + 3rem);
            min-height: calc(100vh - 150px);
            display: flex;
            align-items: center;
          justify-content: center;
          gap: var(--space-xs);
          transition: var(--transition);
          text-decoration: none;
        }
        
        .btn-outline:hover {
          background: rgba(255, 0, 153, 0.1);
          transform: translateY(-3px);
          box-shadow: var(--shadow-pink);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `
    }));
  }
});

// Backward compatibility for API endpoint
app.get('/api/verify-email', (req, res) => {
  const { token } = req.query;
  // Redirect to the main verification endpoint
  res.redirect(`/verify-email?token=${token}`);
});

// Check verification status
app.get('/api/verification-status', (req, res) => {
  const { email } = req.query;
  
  console.log('Checking verification status for:', email);
  
  const user = users.find(user => user.email === email);
  
  if (!user) {
    console.log('User not found for verification status check');
    return res.status(404).json({ message: 'User not found' });
  }
  
  console.log('Verification status:', user.verified);
  res.status(200).json({ verified: user.verified });
});

// Resend verification email
app.post('/api/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  console.log('Resend verification request for:', email);
  
  const user = users.find(user => user.email === email);
  
  if (!user) {
    console.log('User not found for resend verification');
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (user.verified) {
    console.log('User already verified');
    return res.status(400).json({ message: 'Email already verified' });
  }
  
  // Generate new token
  const token = jwt.sign(
    { email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  // Update user token
  user.token = token;
  
  // Save users to file
  saveUsers();
  
  try {
    // Set up verification URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    // Send verification email
    await transporter.sendMail({
      from: `"Venture3" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email for Venture3',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff0080;">Welcome to Venture3!</h1>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <p>Hello ${user.name},</p>
            <p>You requested a new verification link for your Venture3 account.</p>
            <p>Please click the button below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #ff0080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #ff0080;"><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p>This link will expire in 24 hours.</p>
          </div>
          
          <div style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            <p>If you did not create an account with Venture3, please ignore this email.</p>
            <p>&copy; 2025 Venture3. All rights reserved.</p>
          </div>
        </div>
      `
    });
    
    console.log('Verification email resent to:', email);
    
    res.status(200).json({ 
      message: 'Verification email resent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ 
      message: 'Failed to resend verification email. Please try again later.'
    });
  }
});

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for:', email);
  
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    console.log('Invalid credentials for:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  if (!user.verified) {
    console.log('User not verified:', email);
    return res.status(403).json({ 
      message: 'Email not verified. Please check your inbox for verification link.',
      verified: false,
      email
    });
  }
  
  // Generate login token
  const token = jwt.sign(
    { email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log('Login successful for:', email);
  res.status(200).json({ 
    message: 'Login successful',
    token,
    verified: true,
    name: user.name
  });
});

// Dashboard content - protected route
app.get('/api/dashboard-content', isAuthenticated, (req, res) => {
  console.log('Dashboard accessed by:', req.user.email);
  
  const user = req.user;
  const isInvestor = user.isInvestor || false;
  
  if (isInvestor) {
    // Return investor-specific dashboard data
    res.json({
      userName: user.name,
      portfolioValue: 150000,
      fundsRaised: 250000,
      currentValue: 175000,
      roi: 16.7,
      projects: [
        { id: 1, name: 'DeFi Protocol', status: 'Active' },
        { id: 2, name: 'NFT Marketplace', status: 'Due Diligence' }
      ]
    });
  } else {
    // Return project creator dashboard data
    res.json({
      userName: user.name,
      projects: [
        { id: 1, name: 'Sample Project', status: 'Fundraising' }
      ]
    });
  }
});

// Get project details
app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  
  // Basic project information
  const projectData = {
    id: projectId,
    name: 'Sample Project',
    description: 'This is a sample project description.',
    category: 'Technology',
    publicDetails: 'This information is visible to everyone.'
  };
  
  // Check if user is authenticated
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.find(user => user.email === decoded.email);
      
      if (user && user.verified) {
        // Add protected information for verified users
        projectData.protectedDetails = 'This information is only visible to verified users.';
        projectData.contactInfo = 'Project owner: contact@example.com';
        projectData.investmentOpportunities = [
          { type: 'Seed Round', amount: '$500,000', equity: '10%' }
        ];
      }
    } catch (error) {
      // Invalid token - no additional data
    }
  }
  
  res.json(projectData);
});

// Root route handler - render with consistent header
app.get('/', (req, res) => {
  // Instead of just sending the file, we'll render it with our layout
  // Check if index.html exists and read it
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    try {
      // Read the file
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Extract the main content from between body tags
      const bodyMatch = content.match(/<body>([\s\S]*)<\/body>/i);
      
      if (bodyMatch && bodyMatch[1]) {
        // Extract content, removing header and footer if they exist
        let mainContent = bodyMatch[1];
        
        // Remove header and footer if they exist
        mainContent = mainContent.replace(/<header[\s\S]*?<\/header>/gi, '');
        mainContent = mainContent.replace(/<footer[\s\S]*?<\/footer>/gi, '');
        
        // Send with our consistent layout
        res.send(renderWithLayout('Home', mainContent));
      } else {
        // If can't extract body content, just send the file
        res.sendFile(indexPath);
      }
    } catch (error) {
      console.error('Error reading index.html:', error);
      res.sendFile(indexPath);
    }
  } else {
    // If index.html doesn't exist, render a default home page
    const homeContent = `
      <div class="home-container">
        <div class="hero">
          <div class="hero-content">
            <h1>Welcome to <span>Venture3</span></h1>
            <p>The premier platform connecting innovative blockchain projects with crypto investors.</p>
            <div class="hero-buttons">
              <a href="/projects.html" class="primary-btn">Explore Projects</a>
              <a href="/learn.html" class="btn-outline">Learn More</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    res.send(renderWithLayout('Home', homeContent));
  }
});

// Serve HTML files with consistent header
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  
  // If it ends with .html or has no extension, try to serve the HTML file
  if (page.endsWith('.html') || !page.includes('.')) {
    const filePath = path.join(__dirname, page.endsWith('.html') ? page : `${page}.html`);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      try {
        // Read the file
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract the main content from between body tags
        const bodyMatch = content.match(/<body>([\s\S]*)<\/body>/i);
        
        if (bodyMatch && bodyMatch[1]) {
          // Extract content, removing header and footer if they exist
          let mainContent = bodyMatch[1];
          
          // Remove header and footer if they exist
          mainContent = mainContent.replace(/<header[\s\S]*?<\/header>/gi, '');
          mainContent = mainContent.replace(/<footer[\s\S]*?<\/footer>/gi, '');
          
          // Extract title from the original HTML
          const titleMatch = content.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch && titleMatch[1] ? titleMatch[1].replace(' - Venture3', '') : page;
          
          // Send with our consistent layout
          return res.send(renderWithLayout(title, mainContent));
        }
      } catch (error) {
        console.error(`Error processing ${page}:`, error);
      }
    }
    
    // If we get here, either the file doesn't exist or we couldn't process it
    // Fall back to normal file sending
    res.sendFile(filePath, (err) => {
      if (err) {
        // If file not found, continue to next middleware
        if (err.code === 'ENOENT') {
          next();
        } else {
          // For other errors, send error response
          res.status(500).send('Error serving file');
        }
      }
    });
  } else {
    // For other file types, continue to next middleware
    next();
  }
});

// Debug endpoint to list all users (for testing only)
app.get('/api/debug/users', (req, res) => {
  res.json(users.map(u => ({ 
    name: u.name, 
    email: u.email, 
    verified: u.verified,
    isInvestor: u.isInvestor 
  })));
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Catch-all route for 404 errors with consistent header
app.use((req, res) => {
  console.log('404 for:', req.originalUrl);
  
  const notFoundContent = `
    <div class="error-container">
      <div class="error-card">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/" class="primary-btn">Go to Homepage</a>
      </div>
    </div>
  `;
  
  res.status(404).send(renderWithLayout('Page Not Found', notFoundContent, {
    additionalStyles: `
      .error-container {
        max-width: 600px;
        margin: 0 auto;
        padding-top: calc(var(--header-height) + 2 * var(--space-sm) + 3rem);
        min-height: calc(100vh - 150px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .error-card {
        background: var(--transparent-gray);
        backdrop-filter: blur(10px);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        box-shadow: var(--shadow-lg);
        border: 1px solid rgba(255, 0, 153, 0.2);
        text-align: center;
        animation: fadeIn 0.5s ease-out;
        width: 100%;
      }
      
      .error-icon {
        width: 80px;
        height: 80px;
        margin: var(--space-md) auto;
        border-radius: 50%;
        background: rgba(255, 0, 153, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        font-size: 2.5rem;
      }
      
      h1 {
        color: #ef4444;
        font-size: 2rem;
        margin-bottom: var(--space-md);
      }
      
      p {
        color: var(--text-secondary);
        margin-bottom: var(--space-lg);
        line-height: 1.6;
      }
      
      .primary-btn {
        background: linear-gradient(90deg, var(--pink), var(--light-pink));
        color: var(--text-white);
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-full);
        font-weight: 600;
        font-size: 1rem;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-xs);
        box-shadow: var(--shadow-pink);
        cursor: pointer;
        transition: var(--transition);
        text-decoration: none;
      }
      
      .primary-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(255, 0, 153, 0.4);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
  }));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using email: ${process.env.SMTP_USER}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});