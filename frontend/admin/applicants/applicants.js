// DOM Elements
const loadingSpinner = document.getElementById("loadingSpinner");
const allStudentsTableBody = document.getElementById("allStudentsTableBody");

// Fetch applicants data from server
async function fetchApplicants() {
  showLoading();
  try {
    const response = await fetch('/api/admin/applicants', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch applicants');
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      renderApplicantsTable(data.data);
    } else {
      showNotification('No applicants found', 'info');
      renderEmptyState();
    }
  } catch (error) {
    console.error('Error fetching applicants:', error);
    showNotification('Failed to load applicants', 'error');
    renderEmptyState();
  } finally {
    hideLoading();
  }
}

// Render applicants data in the table
function renderApplicantsTable(applicants) {
  if (!allStudentsTableBody) return;
  
  // Clear existing table rows
  allStudentsTableBody.innerHTML = '';
  
  if (applicants.length === 0) {
    renderEmptyState();
    return;
  }
  
  // Create table rows for each applicant
  applicants.forEach(applicant => {
    const row = document.createElement('tr');
    
    // Format application date
    const appDate = new Date(applicant.applicationDate);
    const formattedDate = appDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Create table cells
    row.innerHTML = `
      <td>${applicant.applicantId || 'N/A'}</td>
      <td>${applicant.name || 'No name provided'}</td>
      <td>${applicant.course || 'Not specified'}</td>
      <td>${formattedDate}</td>
      <td>${applicant.currentScore || 0}</td>
      <td>
        <span class="status-badge status-${applicant.status.toLowerCase().replace(' ', '-')}">
          ${applicant.status}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view-btn" data-id="${applicant._id}">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="action-btn Disapprove-btn" data-id="${applicant._id}">
            <i class="fas fa-times"></i> Disapprove
          </button>
        </div>
      </td>
    `;
    
    allStudentsTableBody.appendChild(row);
  });
  
  // Add event listeners to action buttons
  addActionButtonListeners();
}

function viewApplicantDetails(applicantId) {
  // Store the applicant ID in sessionStorage
  sessionStorage.setItem('currentApplicantId', applicantId);
  
  // Redirect to the profile page with the ID in the URL
  window.location.href = `/frontend/AdminSide/ProfileView/ApplicantProfile.html?id=${applicantId}`;
}

// Disapprove applicant
async function DisapproveApplicant(applicantId) {
  if (!confirm('Are you sure you want to Disapprove this applicant?')) {
    return;
  }
  
  showLoading();
  try {
    const response = await fetch(`/api/admin/applicants/${applicantId}/Disapprove`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Applicant disapproveed successfully', 'success');
      await fetchApplicants(); // Refresh the list
    } else {
      showNotification(data.error || 'Failed to disapprove applicant', 'error');
    }
  } catch (error) {
    console.error('Error disapproving applicant:', error);
    showNotification('Failed to disapprove applicant', 'error');
  } finally {
    hideLoading();
  }
}

// Render empty state when no applicants found
function renderEmptyState() {
  if (!allStudentsTableBody) return;
  
  allStudentsTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-state">
        <i class="fas fa-users-slash"></i>
        <h3>No Applicants Found</h3>
        <p>There are currently no applicants in the system.</p>
      </td>
    </tr>
  `;
}

// Add event listeners to action buttons
function addActionButtonListeners() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const DisapproveButtons = document.querySelectorAll('.Disapprove-btn');
  
  viewButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const applicantId = e.currentTarget.getAttribute('data-id');
      viewApplicantDetails(applicantId);
    });
  });
  
  DisapproveButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const applicantId = e.currentTarget.getAttribute('data-id');
      DisapproveApplicant(applicantId);
    });
  });
}

