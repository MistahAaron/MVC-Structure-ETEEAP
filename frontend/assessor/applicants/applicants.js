// Mock data - replace with real API calls in production
let applicants = [];
let currentSection = "applicants";
let editingId = null;
let deleteId = null;

// DOM Elements
const applicantTableBody = document.getElementById("applicantTableBody");
const searchInput = document.getElementById("searchInput");
const loadingSpinner = document.getElementById("loadingSpinner");
const navItems = document.querySelectorAll(".nav-item");


function updateUserDisplay(user) {
    const usernameElement = document.querySelector('.username');
    if (usernameElement && user) {
        usernameElement.textContent = user.fullName || 'Assessor';
        
        // Update avatar with first initial
        const avatarElement = document.querySelector('.user-avatar');
        if (avatarElement) {
            avatarElement.textContent = user.fullName ? 
                user.fullName.charAt(0).toUpperCase() : 'A';
        }
    }
}


// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
    initializeEventListeners();
    await loadApplicants();
    await loadAssessorInfo(); // Add this line
});

function initializeEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            // Only prevent default if it's not a link
            if (!e.target.closest('a')) {
                e.preventDefault();
                const section = item.dataset.section;
                navigateToSection(section);
            }
        });
    });

    // Search functionality
    searchInput.addEventListener("input", handleSearch);
}

function navigateToSection(section) {
    console.log(`Navigating to ${section}`);
    // No alert here - actual navigation happens via href in the anchor tags
}

async function loadApplicants() {
    showLoading();
    try {
        // Mock data with more status options and scores
        applicants = [
            {
                _id: "00001",
                name: "John Doe",
                email: "john@example.com",
                course: "Computer Science",
                enrollmentDate: "2023-01-15",
                status: "pending",
                score: 85
            },
            {
                _id: "00002",
                name: "Jane Smith",
                email: "jane@example.com",
                course: "Business Administration",
                enrollmentDate: "2023-02-20",
                status: "approved",
                score: 92
            },
            {
                _id: "00003",
                name: "Robert Johnson",
                email: "robert@example.com",
                course: "Computer Science",
                enrollmentDate: "2022-11-10",
                status: "rejected",
                score: 65
            },
            {
                _id: "00004",
                name: "Maria Garcia",
                email: "maria@example.com",
                course: "Business Administration",
                enrollmentDate: "2023-03-05",
                status: "in-progress",
                score: 78
            },
            {
                _id: "00005",
                name: "Michael Brown",
                email: "michael@example.com",
                course: "Education",
                enrollmentDate: "2023-04-18",
                status: "pending",
                score: 88
            },
            {
                _id: "00006",
                name: "Sarah Wilson",
                email: "sarah@example.com",
                course: "Computer Science",
                enrollmentDate: "2023-05-22",
                status: "in-progress",
                score: 75
            }
        ];
        
        renderApplicantTable(applicants);
    } catch (error) {
        console.error("Error loading applicants:", error);
        showNotification("Error loading applicants", "error");
        applicants = [];
        renderApplicantTable([]);
    } finally {
        hideLoading();
    }
}

function renderApplicantTable(applicantsToRender) {
    applicantTableBody.innerHTML = "";

    if (applicantsToRender.length === 0) {
        applicantTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Applicants Found</h3>
                </td>
            </tr>
        `;
        return;
    }

    applicantsToRender.forEach(applicant => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${applicant._id}</td>
            <td>${escapeHtml(applicant.name)}</td>
            <td>${escapeHtml(applicant.course)}</td>
            <td>${formatDate(applicant.enrollmentDate)}</td>
            <td>
                <span class="status-badge status-${applicant.status}">
                    ${formatStatus(applicant.status)}
                </span>
            </td>
            <td>${applicant.score || 'N/A'}</td>
            <td class="action-buttons">
                <a href="/frontend/AssessorSide/Evaluation/evaluation.html?id=${applicant._id}" class="action-btn view-btn">
                    <i class="fas fa-eye"></i> View
                </a>
                <button class="action-btn reject-btn" onclick="rejectApplicant('${applicant._id}')" ${applicant.status === 'rejected' ? 'disabled' : ''}>
                    <i class="fas fa-times-circle"></i> Reject
                </button>
            </td>
        `;
        applicantTableBody.appendChild(row);
    });
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'in-progress': 'In Progress'
    };
    return statusMap[status] || capitalizeFirstLetter(status);
}

function viewApplicant(id) {
    const applicant = applicants.find(a => a._id === id);
    if (applicant) {
        showNotification(`Viewing applicant: ${applicant.name} (Status: ${formatStatus(applicant.status)})`, "info");
        console.log("Viewing applicant details:", applicant);
    }
}

function rejectApplicant(id) {
    if (confirm("Are you sure you want to reject this applicant?")) {
        showLoading();
        try {
            const applicantIndex = applicants.findIndex(a => a._id === id);
            if (applicantIndex !== -1) {
                applicants[applicantIndex].status = "rejected";
                renderApplicantTable(applicants);
                showNotification("Applicant has been rejected", "success");
            }
        } catch (error) {
            console.error("Error rejecting applicant:", error);
            showNotification("Error rejecting applicant", "error");
        } finally {
            hideLoading();
        }
    }
}

// Search Functionality
let searchTimeout;
function handleSearch(e) {
    clearTimeout(searchTimeout);
    const searchTerm = e.target.value.trim().toLowerCase();

    searchTimeout = setTimeout(() => {
        if (searchTerm.length === 0) {
            renderApplicantTable(applicants);
            return;
        }

        const filteredApplicants = applicants.filter(applicant => 
            applicant.name.toLowerCase().includes(searchTerm) || 
            applicant.email.toLowerCase().includes(searchTerm) ||
            applicant.course.toLowerCase().includes(searchTerm)
        );
        
        renderApplicantTable(filteredApplicants);
    }, 300);
}

// Utility Functions
function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function capitalizeFirstLetter(string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Loading Spinner Functions
function showLoading() {
    loadingSpinner.classList.add("active");
}

function hideLoading() {
    loadingSpinner.classList.remove("active");
}

// Notification System
function showNotification(message, type = "info") {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add notification to the document
    document.body.appendChild(notification);

    // Remove notification after delay
    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Profile Dropdown Functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // Toggle dropdown on click
    profileDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.opacity === '1';
      
      // Close all other dropdowns first
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.style.opacity = '0';
          menu.style.visibility = 'hidden';
          menu.style.transform = 'translateY(10px)';
        }
      });
      
      // Toggle current dropdown
      if (isVisible) {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.visibility = 'hidden';
        dropdownMenu.style.transform = 'translateY(10px)';
      } else {
        dropdownMenu.style.opacity = '1';
        dropdownMenu.style.visibility = 'visible';
        dropdownMenu.style.transform = 'translateY(0)';
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      dropdownMenu.style.opacity = '0';
      dropdownMenu.style.visibility = 'hidden';
      dropdownMenu.style.transform = 'translateY(10px)';
    });
    
    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
});


// Enhanced Logout Functionality
async function handleLogout() {
    showLoading();
    try {
        // First check if we're actually logged in
        const authCheck = await fetch('http://localhost:3000/assessor/auth-status', {
            credentials: 'include'
        });
        
        if (!authCheck.ok) {
            // If not authenticated, just redirect
            sessionStorage.removeItem('assessorData');
            window.location.href = '/frontend/AssessorSide/AssessorLogin/AssessorLogin.html';
            return;
        }

        // If authenticated, proceed with logout
        const response = await fetch('http://localhost:3000/assessor/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
            // Show success notification before redirecting
            showNotification('Logout successful! Redirecting to login page...', 'success');
            
            // Clear any stored data
            sessionStorage.removeItem('assessorData');
            
            // Wait a moment so user can see the notification
            setTimeout(() => {
                window.location.href = data.redirectTo || '/frontend/AssessorSide/AssessorLogin/AssessorLogin.html';
            }, 1500);
        } else {
            showNotification('Logout failed. Please try again.', 'error');
            hideLoading();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed. Please try again.', 'error');
        hideLoading();
    }
}

// Add this function to fetch and display user info
async function loadAssessorInfo() {
    try {
        const response = await fetch('http://localhost:3000/assessor/auth-status', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch assessor info');
        }
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
            updateUserDisplay(data.user);
            // Store user data in sessionStorage for quick access
            sessionStorage.setItem('assessorData', JSON.stringify(data.user));
        } else {
            // If not authenticated, redirect to login
            window.location.href = '/frontend/AssessorSide/AssessorLogin/AssessorLogin.html';
        }
    } catch (error) {
        console.error('Error loading assessor info:', error);
        // Fallback to sessionStorage if available
        const storedData = sessionStorage.getItem('assessorData');
        if (storedData) {
            updateUserDisplay(JSON.parse(storedData));
        } else {
            // If no stored data and can't fetch, redirect to login
            window.location.href = '/frontend/AssessorSide/AssessorLogin/AssessorLogin.html';
        }
    }
}