require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = express();

// CORS middleware - allow all origins in development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'venture33_secret_token_key';

// Configure email transporter with Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify email transport on startup
transporter.verify((error, success) => {
    if (error) console.error('SMTP server connection error:', error);
    else console.log('SMTP server connection established, ready to send emails');
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
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    try {
        console.log('Validating token:', token);
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);
        const user = users.find(user => user.email === decoded.email);
        console.log('Found user:', user ? 'Yes' : 'No', 'Email:', decoded.email);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.verified) return res.status(403).json({ message: 'Email not verified' });
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Render layout function with improved logout button styling
function renderWithLayout(title, content, options = {}) {
    const opts = { additionalStyles: '', additionalScripts: '', additionalHeadContent: '', ...options };
    console.log(`Rendering page: ${title} with layout`);
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
                /* Clean styling for logout button */
                .logout-btn {
                    background: linear-gradient(90deg, var(--pink), var(--light-pink));
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .logout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(255, 0, 153, 0.3);
                }
                ${opts.additionalStyles}
            </style>
        </head>
        <body>
            <div class="background" id="background"></div>
            <div class="glow-effect"></div>
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
                <div class="user-profile" id="userProfile" style="display: none;">
                    <a href="/create-project.html" class="list-project-btn">
                        <i class="fas fa-plus-circle"></i> List Your Project
                    </a>
                    <span class="user-name" id="userName">User</span>
                    <button class="logout-btn" id="logoutBtn" style="display: block;">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </header>
            ${content}
            <footer>
                <div class="copyright">
                    © 2025 Venture3. All rights reserved.
                </div>
            </footer>
            <script src="/js/main.js"></script>
            <script>
                // Ensure logout button works even if main.js handlers fail
                document.addEventListener('DOMContentLoaded', function() {
                    const logoutBtn = document.getElementById('logoutBtn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', function() {
                            localStorage.removeItem('isLoggedIn');
                            localStorage.removeItem('userName');
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('userEmail');
                            window.location.href = '/index.html';
                        });
                    }
                });
            </script>
            ${opts.additionalScripts}
        </body>
        </html>
    `;
}

// API Routes
app.get('/api/validate-token', isAuthenticated, (req, res) => {
    res.status(200).json({ message: 'Token is valid', user: req.user });
});

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
    const existingUserIndex = users.findIndex(u => u.email === testUser.email);
    if (existingUserIndex !== -1) users[existingUserIndex] = testUser;
    else users.push(testUser);
    saveUsers();
    res.json({ message: 'Test user created', user: testUser });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password, investorType, investmentFocus, isInvestor } = req.body;
    console.log('Signup request received:', { name, email, investorType });

    if (users.some(user => user.email === email)) {
        console.log('Email already exists:', email);
        return res.status(409).json({ 
            message: 'An account with this email already exists. Please log in or use a different email.' 
        });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
    const newUser = {
        name,
        email,
        password,
        verified: false,
        token,
        investorType,
        investmentFocus,
        isInvestor: isInvestor || false,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers();
    console.log('User added:', newUser.email);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    try {
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
                        <p>Thank you for joining Venture3.</p>
                        <p>Please click the button below to verify your email address:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #ff0080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link: <a href="${verificationUrl}" style="color: #ff0080;">${verificationUrl}</a></p>
                        <p>This link expires in 24 hours.</p>
                    </div>
                    <div style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                        <p>If you did not create an account, ignore this email.</p>
                        <p>© 2025 Venture3. All rights reserved.</p>
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
        res.status(201).json({ 
            message: 'User registered successfully, but there was an issue sending the verification email. Please use the resend option.',
            emailFailed: true,
            email
        });
    }
});

app.post('/api/login', (req, res) => {
    console.log('Received login request:', req.body);
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    const user = users.find(user => user.email === email);
    if (!user || user.password !== password) {
        console.log('Invalid credentials for:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.verified) {
        console.log('User not verified:', email);
        return res.status(403).json({ 
            message: 'Email not verified. Please check your inbox for the verification link.',
            verified: false,
            email
        });
    }
    
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Login successful for:', email);
    res.status(200).json({ 
        message: 'Login successful',
        token,
        verified: true,
        name: user.name
    });
});

app.post('/api/resend-verification', async (req, res) => {
    const { email } = req.body;
    console.log('Resend verification request for:', email);
    const user = users.find(user => user.email === email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verified) return res.status(400).json({ message: 'Email already verified' });
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
    user.token = token;
    saveUsers();
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
        await transporter.sendMail({
            from: `"Venture3" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Verify Your Email for Venture3',
            html: `
                <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h1 style="color: #ff0080; text-align: center;">Welcome to Venture3!</h1>
                    <div style="background: #f9f9f9; border-radius: 10px; padding: 20px;">
                        <p>Hello ${user.name},</p>
                        <p>You requested a new verification link for your Venture3 account.</p>
                        <p>Please click below to verify your email:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #ff0080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                        </div>
                        <p>Or copy this link: <a href="${verificationUrl}" style="color: #ff0080;">${verificationUrl}</a></p>
                        <p>This link expires in 24 hours.</p>
                    </div>
                    <div style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                        <p>If you did not request this, ignore this email.</p>
                        <p>© 2025 Venture3. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        console.log('Verification email resent to:', email);
        res.status(200).json({ message: 'Verification email resent. Please check your inbox.' });
    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({ message: 'Failed to resend verification email. Please try again later.' });
    }
});

app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    console.log('Verification request received for token:', token);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userIndex = users.findIndex(user => user.email === decoded.email);
        if (userIndex === -1) {
            console.log('User not found for verification');
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
                additionalStyles: `.verification-icon.error { background: rgba(255, 0, 153, 0.1); color: #ef4444; }`
            }));
        }
        users[userIndex].verified = true;
        users[userIndex].token = null;
        saveUsers();
        console.log('User verified:', decoded.email);
        const successContent = `
            <div class="verification-container">
                <div class="verification-card">
                    <div class="verification-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h1>Email Verified</h1>
                    <p>Your email has been successfully verified. You can now log in to your account.</p>
                    <div class="verification-actions">
                        <a href="/login.html?verified=true" class="btn-primary">Go to Login</a>
                    </div>
                </div>
            </div>
        `;
        res.send(renderWithLayout('Email Verified', successContent, {
            additionalStyles: `.verification-icon.success { background: rgba(0, 255, 153, 0.1); color: #00cc99; }`
        }));
    } catch (error) {
        console.error('Verification error:', error.message);
        const errorContent = `
            <div class="verification-container">
                <div class="verification-card">
                    <div class="verification-icon error">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <h1>Verification Failed</h1>
                    <p>Invalid or expired verification link. Please request a new one.</p>
                    <div class="verification-actions">
                        <a href="/signup.html" class="btn-outline">Request New Link</a>
                    </div>
                </div>
            </div>
        `;
        res.send(renderWithLayout('Verification Failed', errorContent, {
            additionalStyles: `.verification-icon.error { background: rgba(255, 0, 153, 0.1); color: #ef4444; }`
        }));
    }
});

// Serve HTML files with layout
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.startsWith('api')) return next();

    const filePath = path.join(__dirname, page.endsWith('.html') ? page : `${page}.html`);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const titleMatch = content.match(/<title>(.*?)<\/title>/i);
            const title = titleMatch && titleMatch[1] ? titleMatch[1].replace(' - Venture3', '') : page;
            const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/i);
            let mainContent = bodyMatch && bodyMatch[1] ? bodyMatch[1] : content;
            console.log(`Processing ${page}: Replacing header and footer`);
            mainContent = mainContent.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');
            mainContent = mainContent.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
            console.log(`After replacement, ${page} content length: ${mainContent.length}`);
            return res.send(renderWithLayout(title, mainContent));
        } catch (error) {
            console.error(`Error processing ${page}:`, error);
            return res.status(500).send('Error processing page');
        }
    }
    next();
});

// Root route
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        try {
            const content = fs.readFileSync(indexPath, 'utf8');
            const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/i);
            let mainContent = bodyMatch && bodyMatch[1] ? bodyMatch[1] : content;
            mainContent = mainContent.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');
            mainContent = mainContent.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
            console.log('Rendering root with content length:', mainContent.length);
            return res.send(renderWithLayout('Home', mainContent));
        } catch (error) {
            console.error('Error reading index.html:', error);
        }
    }
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
});

// 404 handler
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
        additionalStyles: `.error-icon { background: rgba(255, 0, 153, 0.1); color: #ef4444; }`
    }));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using email: ${process.env.SMTP_USER}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});