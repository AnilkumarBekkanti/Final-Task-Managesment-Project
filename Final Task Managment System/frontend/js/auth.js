// Registration Logic
document.getElementById("registerForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const errorMessage = document.getElementById("errorMessage");
    
    const userData = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful!");
            window.location.href = "index.html";
        } else {
            errorMessage.textContent = data.detail || "Registration failed";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = "Connection error";
        errorMessage.style.display = "block";
    }
});

// Login Logic
document.getElementById("loginForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const errorMessage = document.getElementById("errorMessage");
    
    const credentials = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access);
            localStorage.setItem('username', data.username);
            window.location.href = "dashboard.html";
        } else {
            errorMessage.textContent = data.detail || "Invalid credentials";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = "Connection error";
        errorMessage.style.display = "block";
    }
});