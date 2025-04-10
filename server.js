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
            <h1 style="color: #6c3ce9;">Welcome to Venture3!</h1>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <p>Hello ${name},</p>
            <p>Thank you for joining Venture3, the premier platform connecting innovative blockchain projects with crypto investors.</p>
            <p>Please click the button below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #6c3ce9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #6c3ce9;"><a href="${verificationUrl}">${verificationUrl}</a></p>
            
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

// Verification route - direct HTML response
app.get('/verify-email', (req, res) => {
  const { token } = req.query;
  
  console.log('Verification request received for token:', token);
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIndex = users.findIndex(user => user.email === decoded.email);
    
    if (userIndex === -1) {
      console.log('User not found for verification');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: red; }
              .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; 
                     background-color: #6c3ce9; color: white; text-decoration: none; 
                     border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1 class="error">Verification Failed</h1>
            <p>User not found or verification link is invalid.</p>
            <a href="/" class="btn">Return to Login</a>
          </body>
        </html>
      `);
    }
    
    // Update user verification status
    users[userIndex].verified = true;
    
    // Save the updated user status
    saveUsers();
    
    console.log('User verified successfully:', users[userIndex].email);
    
    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: green; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; 
                   background-color: #6c3ce9; color: white; text-decoration: none; 
                   border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1 class="success">Email Verified Successfully!</h1>
          <p>Your email has been verified. You can now log in to your account.</p>
          <a href="/" class="btn">Login Now</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error verifying email:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; 
                   background-color: #6c3ce9; color: white; text-decoration: none; 
                   border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>The verification link is invalid or has expired.</p>
          <a href="/" class="btn">Return to Login</a>
        </body>
      </html>
    `);
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
            <h1 style="color: #6c3ce9;">Welcome to Venture3!</h1>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <p>Hello ${user.name},</p>
            <p>You requested a new verification link for your Venture3 account.</p>
            <p>Please click the button below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #6c3ce9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #6c3ce9;"><a href="${verificationUrl}">${verificationUrl}</a></p>
            
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

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve HTML files automatically
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  // If it ends with .html or has no extension, try to serve the HTML file
  if (page.endsWith('.html') || !page.includes('.')) {
    const filePath = path.join(__dirname, page.endsWith('.html') ? page : `${page}.html`);
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

// Catch-all route for 404 errors
app.use((req, res) => {
  console.log('404 for:', req.originalUrl);
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; }
          .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; 
                 background-color: #6c3ce9; color: white; text-decoration: none; 
                 border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1 class="error">404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/" class="btn">Go to Homepage</a>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using email: ${process.env.SMTP_USER}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});