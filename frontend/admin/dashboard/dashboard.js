const API_BASE_URL = "http://localhost:3000/dashboard";
let students = [];
let courses = [];
let currentSection = "dashboard";
let editingId = null;
let editingCourseId = null;
let deleteType = "";
let deleteId = null;

// DOM Elements
const studentTableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");
const loadingSpinner = document.getElementById("loadingSpinner");
const logoutLink = document.getElementById("logoutLink");

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", async () => {
  initializeEventListeners();
  await loadAdminInfo();
  await checkAndLoadData();
});

// Initialize all event listeners
function initializeEventListeners() {
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  // Logout link
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // Modal outside click handlers
  window.onclick = (event) => {
    if (event.target === assessorModal) closeAssessorModal();
    if (event.target === courseModal) closeCourseModal();
    if (event.target === document.getElementById("deleteConfirmationModal")) {
      closeDeleteModal();
    }
  };

  // Profile dropdown functionality
  const profileDropdown = document.querySelector('.profile-dropdown');
  if (profileDropdown) {
    profileDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
      const menu = this.querySelector('.dropdown-menu');
      const isOpen = menu.style.opacity === '1';
      
      // Toggle dropdown
      if (isOpen) {
        menu.style.opacity = '0';
        menu.style.visibility = 'hidden';
        menu.style.transform = 'translateY(10px)';
      } else {
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
        menu.style.transform = 'translateY(0)';
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
    const menu = document.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.opacity = '0';
      menu.style.visibility = 'hidden';
      menu.style.transform = 'translateY(10px)';
    }
  });
}

// Initial data load and checks
async function checkAndLoadData() {
  showLoading();
  try {
    await loadCourses();
    await Promise.all([loadStudents(), updateDashboardStats()]);
  } catch (error) {
    console.error("Error during initialization:", error);
    showNotification("Error initializing application", "error");
  } finally {
    hideLoading();
  }
}

// API Functions
async function updateDashboardStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    if (!response.ok) throw new Error("Failed to fetch dashboard stats");

    const stats = await response.json();

    // Update dashboard cards
    const cards = document.querySelectorAll('.card');
    if (cards.length >= 4) {
      cards[0].querySelector('.card-value').textContent = stats.totalStudents || 0;
      cards[1].querySelector('.card-value').textContent = stats.newApplicants || 0;
      cards[2].querySelector('.card-value').textContent = stats.withoutAssessor || 0;
      cards[3].querySelector('.card-value').textContent = stats.rejected || 0;
    }
  } catch (error) {
    console.error("Error updating dashboard stats:", error);
    showNotification("Error updating statistics", "error");
  }
}

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students`);
    if (!response.ok) throw new Error("Failed to fetch students");

    students = await response.json();
    renderStudentTable(students);
  } catch (error) {
    console.error("Error loading students:", error);
    showNotification("Error loading students", "error");
    students = [];
    renderStudentTable([]);
  }
}

async function loadCourses() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/courses`);
    if (!response.ok) throw new Error("Failed to fetch courses");

    courses = await response.json();
    updateCourseDropdown(courses);
    return courses;
  } catch (error) {
    console.error("Error loading courses:", error);
    showNotification("Error loading courses", "error");
    courses = [];
    return [];
  }
}

// CRUD Operations for Students
async function createStudent(studentData) {
  const response = await fetch(`${API_BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create student");
  }

  return response.json();
}

async function updateStudent(id, studentData) {
  const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update student");
  }

  return response.json();
}

async function deleteStudent(id) {
  deleteType = "student";
  deleteId = id;
  document.getElementById("deleteConfirmationModal").style.display = "flex";
}

// CRUD Operations for Courses
async function createCourse(courseData) {
  const response = await fetch(`${API_BASE_URL}/api/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create course");
  }

  return response.json();
}

async function updateCourse(id, courseData) {
  const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update course");
  }

  return response.json();
}

async function deleteCourse(id) {
  deleteType = "course";
  deleteId = id;
  document.getElementById("deleteConfirmationModal").style.display = "flex";
}

function closeDeleteModal() {
  document.getElementById("deleteConfirmationModal").style.display = "none";
  deleteType = "";
  deleteId = null;
}

async function confirmDelete() {
  showLoading();
  try {
    let response;
    if (deleteType === "student") {
      response = await fetch(`${API_BASE_URL}/api/students/${deleteId}`, {
        method: "DELETE",
      });
    } else if (deleteType === "course") {
      response = await fetch(`${API_BASE_URL}/api/courses/${deleteId}`, {
        method: "DELETE",
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete");
    }

    showNotification(`${deleteType} deleted successfully`, "success");
    
    if (deleteType === "student") {
      await loadStudents();
    } else if (deleteType === "course") {
      await loadCourses();
    }
    await updateDashboardStats();
  } catch (error) {
    console.error("Error during deletion:", error);
    showNotification(error.message || "Error during deletion", "error");
  } finally {
    hideLoading();
    closeDeleteModal();
  }
}

// Form Handling
async function handleFormSubmit(e) {
  e.preventDefault();
  showLoading();

  const studentData = {
    name: document.getElementById("studentName").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    course: document.getElementById("studentCourse").value,
    enrollmentDate: document.getElementById("enrollmentDate").value,
    status: "active",
  };

  try {
    if (editingId) {
      await updateStudent(editingId, studentData);
      showNotification("Student updated successfully", "success");
    } else {
      await createStudent(studentData);
      showNotification("Student created successfully", "success");
    }
    closeAssessorModal();
    await loadStudents();
    await updateDashboardStats();
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error saving student data", "error");
  } finally {
    hideLoading();
  }
}

async function handleCourseFormSubmit(e) {
  e.preventDefault();
  showLoading();

  const courseData = {
    name: document.getElementById("courseName").value.trim(),
    description: document.getElementById("courseDescription").value.trim(),
    duration: parseInt(document.getElementById("courseDuration").value),
    status: document.getElementById("courseStatus").value,
  };

  try {
    if (editingCourseId) {
      await updateCourse(editingCourseId, courseData);
      showNotification("Course updated successfully", "success");
    } else {
      await createCourse(courseData);
      showNotification("Course created successfully", "success");
    }
    closeCourseModal();
    await loadCourses();
    await updateDashboardStats();
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error saving course data", "error");
  } finally {
    hideLoading();
  }
}

// UI Rendering Functions
function renderStudentTable(studentsToRender) {
  if (!studentTableBody) return;

  studentTableBody.innerHTML = "";

  if (studentsToRender.length === 0) {
    studentTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No Applicants Found</h3>
        </td>
      </tr>
    `;
    return;
  }

  studentsToRender.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student._id}</td>
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.course)}</td>
      <td>${formatDate(student.enrollmentDate)}</td>
      <td>${student.score || 'N/A'}</td>
      <td>
        <span class="status-badge status-${student.status}">
          ${formatStatus(student.status)}
        </span>
      </td>
      <td class="action-buttons">
        <a href="/frontend/AdminSide/Evaluation/evaluation.html?id=${student._id}" class="action-btn view-btn">
          <i class="fas fa-eye"></i> View
        </a>
        <button class="action-btn reject-btn" onclick="rejectApplicant('${student._id}')" ${student.status === 'rejected' ? 'disabled' : ''}>
          <i class="fas fa-times-circle"></i> Reject
        </button>
      </td>
    `;
    studentTableBody.appendChild(row);
  });
}

function updateCourseDropdown(courses) {
  const courseSelect = document.getElementById("studentCourse");
  if (!courseSelect) return;

  courseSelect.innerHTML = '<option value="">Select Course</option>';

  courses
    .filter((course) => course.status === "active")
    .forEach((course) => {
      const option = document.createElement("option");
      option.value = course._id;
      option.textContent = course.name;
      courseSelect.appendChild(option);
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

// Modal Operations
function openAssessorModal() {
  const assessorModal = document.getElementById("assessorModal");
  if (assessorModal) {
    assessorModal.style.display = "flex";
    editingId = null;
    document.getElementById("studentForm").reset();
    document.getElementById("modalTitle").textContent = "Add New Assessor";
  }
}

function closeAssessorModal() {
  const assessorModal = document.getElementById("assessorModal");
  if (assessorModal) {
    assessorModal.style.display = "none";
    editingId = null;
    document.getElementById("studentForm").reset();
  }
}

function openCourseModal() {
  const courseModal = document.getElementById("courseModal");
  if (courseModal) {
    courseModal.style.display = "flex";
    editingCourseId = null;
    document.getElementById("courseForm").reset();
    document.getElementById("courseModalTitle").textContent = "Add New Course";
  }
}

function closeCourseModal() {
  const courseModal = document.getElementById("courseModal");
  if (courseModal) {
    courseModal.style.display = "none";
    editingCourseId = null;
    document.getElementById("courseForm").reset();
  }
}

// Edit Functions
async function editStudent(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch student");
    }

    const student = await response.json();
    editingId = id;
    
    document.getElementById("modalTitle").textContent = "Edit Student";
    document.getElementById("studentName").value = student.name;
    document.getElementById("studentEmail").value = student.email;
    document.getElementById("studentCourse").value = student.course;
    document.getElementById("enrollmentDate").value = formatDateForInput(student.enrollmentDate);

    document.getElementById("assessorModal").style.display = "flex";
  } catch (error) {
    console.error("Error loading student for edit:", error);
    showNotification(error.message || "Error loading student data", "error");
  } finally {
    hideLoading();
  }
}

async function editCourse(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/api/courses/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch course");
    }

    const course = await response.json();
    editingCourseId = id;
    
    document.getElementById("courseModalTitle").textContent = "Edit Course";
    document.getElementById("courseName").value = course.name;
    document.getElementById("courseDescription").value = course.description;
    document.getElementById("courseDuration").value = course.duration;
    document.getElementById("courseStatus").value = course.status;

    document.getElementById("courseModal").style.display = "flex";
  } catch (error) {
    console.error("Error loading course for edit:", error);
    showNotification(error.message || "Error loading course data", "error");
  } finally {
    hideLoading();
  }
}

// Search Functionality
let searchTimeout;
function handleSearch(e) {
  clearTimeout(searchTimeout);
  const searchTerm = e.target.value.trim().toLowerCase();

  searchTimeout = setTimeout(() => {
    if (searchTerm.length === 0) {
      renderStudentTable(students);
      return;
    }

    const filteredStudents = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm) || 
      student.email.toLowerCase().includes(searchTerm) ||
      student.course.toLowerCase().includes(searchTerm)
    );
    
    renderStudentTable(filteredStudents);
  }, 300);
}

// Profile and Authentication Functions
async function loadAdminInfo() {
  try {
    const response = await fetch('http://localhost:3000/admin/auth-status', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin info');
    }
    
    const data = await response.json();
    
    if (data.authenticated && data.user) {
      updateUserDisplay(data.user);
      sessionStorage.setItem('adminData', JSON.stringify(data.user));
    } else {
      window.location.href = '/frontend/AdminSide/1.adminLogin/adminlogin.html';
    }
  } catch (error) {
    console.error('Error loading admin info:', error);
    const storedData = sessionStorage.getItem('adminData');
    if (storedData) {
      updateUserDisplay(JSON.parse(storedData));
    } else {
      window.location.href = '/frontend/AdminSide/1.adminLogin/adminlogin.html';
    }
  }
}

function updateUserDisplay(user) {
  const usernameElement = document.querySelector('.username');
  if (usernameElement && user) {
    usernameElement.textContent = user.fullName || 'Admin';
    
    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement) {
      avatarElement.textContent = user.fullName ? 
        user.fullName.charAt(0).toUpperCase() : 'A';
    }
  }
}

async function handleLogout() {
  showLoading();
  try {
    const authCheck = await fetch('http://localhost:3000/admin/auth-status', {
      credentials: 'include'
    });
    
    if (!authCheck.ok) {
      sessionStorage.removeItem('adminData');
      window.location.href = '/Frontend/AdminSide/1.adminLogin/adminlogin.html';
      return;
    }

    const response = await fetch('http://localhost:3000/admin/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Logout successful! Redirecting...', 'success');
      sessionStorage.removeItem('adminData');
      setTimeout(() => {
        window.location.href = data.redirectTo || '/Frontend/AdminSide/1.adminLogin/adminlogin.html';
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

// Utility Functions
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(dateString) {
  return new Date(dateString).toISOString().split("T")[0];
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

function showLoading() {
  if (loadingSpinner) loadingSpinner.classList.add("active");
}

function hideLoading() {
  if (loadingSpinner) loadingSpinner.classList.remove("active");
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Make functions available globally
window.editStudent = editStudent;
window.editCourse = editCourse;
window.deleteStudent = deleteStudent;
window.deleteCourse = deleteCourse;
window.confirmDelete = confirmDelete;
window.closeAssessorModal = closeAssessorModal;
window.closeCourseModal = closeCourseModal;
window.closeDeleteModal = closeDeleteModal;
window.handleLogout = handleLogout;