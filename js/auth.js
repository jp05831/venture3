// auth.js

// Login function
async function login(email, password) {
    try {
        console.log('Attempting login with email:', email);
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('Login response status:', response.status, 'Data:', data);
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = '/dashboard.html';
        } else {
            if (response.status === 401) {
                throw new Error('Invalid email or password');
            } else if (response.status === 403 && !data.verified) {
                if (confirm(data.message + ' Would you like to resend the verification email?')) {
                    const resendResponse = await fetch('http://localhost:3000/api/resend-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const resendData = await resendResponse.json();
                    alert(resendData.message);
                }
            } else {
                throw new Error(data.message || 'Login failed');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
    }
}

// Signup function
async function signup(userData) {
    try {
        console.log('Sending signup request with data:', userData);
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        console.log('Signup response status:', response.status, 'Data:', data);
        if (response.ok) {
            alert(data.message || 'Signup successful! Please check your email to verify your account.');
            window.location.href = '/verification-pending.html?email=' + encodeURIComponent(userData.email);
        } else {
            if (response.status === 409) {
                throw new Error('An account with this email already exists. Please log in or use a different email.');
            }
            throw new Error(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        throw error; // Re-throw to let the caller handle the error
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/';
}