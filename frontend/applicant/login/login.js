document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector('.wrapper');

    if (wrapper) {
        wrapper.classList.add('active-popup'); // Show login form immediately on page load
    }

    const buttons = {
        close: document.querySelector('.icon-close'),
        registerLink: document.querySelector('.register-link'),
        loginLink: document.querySelector('.login-link'),
        forgotLink: document.querySelector('.forgot-link')
    };

    // Save previous page URL before navigating to login
    if (document.referrer) {
        sessionStorage.setItem("previousPage", document.referrer);
    }

    // Function to reset input fields
    const resetInputs = () => {
        wrapper?.querySelectorAll('input').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    };

    // Function to show different forms
    const showForm = (formType = '') => {
        wrapper?.classList.remove('active', 'active-forgot', 'active-verification', 'active-new-password');
        if (formType) wrapper?.classList.add(formType);
        resetInputs();
    };

    // Switch to Register Form
    buttons.registerLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('active'); // Show Register Form
    });

    // Switch back to Login Form
    buttons.loginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(''); // Show Login Form
    });

    // Show Forgot Password Form
    buttons.forgotLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('active-forgot'); // Show Forgot Password Form
    });

    // Handle Reset Password Form Submission
    const resetForm = document.getElementById("resetForm");
    const verificationForm = document.getElementById("verificationForm");
    const newPasswordForm = document.getElementById("newPasswordForm");

    resetForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Hide Forgot Password Form & Show Verification Form
        document.querySelector(".form-box.forgot").style.display = "none";
        verificationForm.style.display = "block";
        wrapper.classList.add("active-verification");
    });

    // Handle Verification Code Submission
    const verifyCodeForm = document.getElementById("verifyCodeForm");
    verifyCodeForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        // Hide Verification Form & Show New Password Form
        verificationForm.style.display = "none";
        newPasswordForm.style.display = "block";
        wrapper.classList.add("active-new-password");
    });

    // Handle New Password Submission
    const newPasswordSubmit = document.getElementById("newPasswordSubmit");
    newPasswordSubmit?.addEventListener("submit", (e) => {
        e.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return;
        }

        alert("Password successfully reset! Redirecting to login page...");
        showForm(''); // Redirect to login form
    });

    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.parentElement.querySelector('input'); // Get correct input field
            const icon = toggle.querySelector('ion-icon'); // Get the ion-icon

            // Toggle password visibility
            if (input.type === "password") {
                input.type = "text";
                icon.setAttribute("name", "eye"); // Change icon to open eye
            } else {
                input.type = "password";
                icon.setAttribute("name", "eye-off"); // Change icon back to closed eye
            }
        });
    });
    
    // Handle Terms & Conditions
    document.getElementById("terms-link").addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default link behavior
        document.getElementById("terms-con").style.display = "block"; // Show terms
    });
    
    // Close terms when clicking the "Accept" button and check the checkbox
    document.getElementById("accept-btn").addEventListener("click", function() {
        document.getElementById("terms-con").style.display = "none"; // Hide terms
        document.getElementById("terms-checkbox").checked = true; // Check the checkbox
    });
    

    // Close button handling: Return to previous page
    buttons.close?.addEventListener('click', () => {
        resetInputs();
        wrapper?.classList.remove('active-popup', 'active', 'active-forgot', 'active-verification', 'active-new-password');
        
        window.location.href = "../Home/index.html";
    });
});


registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! Please fill out your personal information.");
            localStorage.setItem("userId", data.userId); // Store userId in local storage
            window.location.href = "../Information/information.html"; // Redirect to personal info page
        } else {
            alert("Registration failed: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
});


loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login successful!");
            localStorage.setItem("authToken", data.token); // Save token
            localStorage.setItem("userId", data.userId);   // Save userId
            window.location.href = "../Timeline/timeline.html"; // Redirect to applicant page
        } else {
            alert("Login failed: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
});

