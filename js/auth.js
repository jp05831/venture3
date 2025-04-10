// auth.js - Authentication utility functions

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
  }
  
  // Redirect if not authenticated
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }
  
  // Check auth status and update UI elements
  function checkAuthStatus() {
    const authElements = document.querySelectorAll('[data-auth-required]');
    const publicElements = document.querySelectorAll('[data-auth-public]');
    
    if (isAuthenticated()) {
      // Show elements that require authentication
      authElements.forEach(el => {
        el.style.display = '';
      });
      
      // Hide elements for non-authenticated users
      publicElements.forEach(el => {
        el.style.display = 'none';
      });
      
      // Update user name if available
      const userNameElement = document.getElementById('user-name');
      if (userNameElement) {
        userNameElement.textContent = localStorage.getItem('userName') || 'User';
      }
    } else {
      // Hide elements that require authentication
      authElements.forEach(el => {
        el.style.display = 'none';
      });
      
      // Show elements for non-authenticated users
      publicElements.forEach(el => {
        el.style.display = '';
      });
    }
  }
  
  // Logout function
  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    window.location.href = '/index.html';
  }
  
  // Initialize auth status check on page load
  document.addEventListener('DOMContentLoaded', checkAuthStatus);