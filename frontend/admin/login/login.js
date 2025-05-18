document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector('.wrapper');

    if (wrapper) {
        wrapper.classList.add('active-popup');
    }

    const buttons = {
        close: document.querySelector('.icon-close'),
        loginLink: document.querySelector('.login-link'),
        forgotLink: document.querySelector('.forgot-link')
    };

    if (document.referrer) {
        sessionStorage.setItem("previousPage", document.referrer);
    }

    const resetInputs = () => {
        wrapper?.querySelectorAll('input').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    };

    const showForm = (formType = '') => {
        wrapper?.classList.remove('active', 'active-forgot', 'active-verification', 'active-new-password');
        if (formType) wrapper?.classList.add(formType);
        resetInputs();
    };

    buttons.loginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(''); // Show Login Form
    });

    // Show Forgot Password Form
    buttons.forgotLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('active-forgot'); // Show Forgot Password Form
    });

    buttons.close?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(''); 
        
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
            showNotification(data.error || "Passwords do not match. Please try again.");
            return;
        }

        showNotification("Password successfully reset! Redirecting to login page...", 'success');
        showForm(''); 
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
    


});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showNotification(data.error ||"Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("Login successful!","success");
            localStorage.setItem("authToken", data.token); 
            localStorage.setItem("userId", data.userId);   
            window.location.href = "../dashboard/dashboard.html"; // 
        } else {
            showNotification(data.error ||"Login failed: " + data.error);
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification(data.error ||"An error occurred. Please try again.");
    }
});

