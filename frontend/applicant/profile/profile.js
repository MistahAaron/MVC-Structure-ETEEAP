document.addEventListener("DOMContentLoaded", async function () {
    // Check authentication status first
    try {
        const authResponse = await fetch('/applicant/auth-status');
        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
            window.location.href = '../Login/login.html';
            return;
        }
        
        // Now proceed with profile loading
        const userId = authData.user?._id || getUserId();
        if (userId) {
            await fetchUserProfile(userId);
            setupEventListeners();
        } else {
            showErrorMessage("No user ID found. Please log in again.");
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        showErrorMessage("Failed to verify authentication. Please try again.");
    }
});

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

// Helper function to display errors
function showErrorMessage(message) {
    let errorElement = document.getElementById("error-message");
    if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.id = "error-message";
        errorElement.style.color = "red";
        errorElement.style.padding = "10px";
        errorElement.style.margin = "10px 0";
        errorElement.style.border = "1px solid #ffcccc";
        errorElement.style.backgroundColor = "#ffeeee";
        document.body.prepend(errorElement);
    }
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

// Function to check and get userId from multiple sources
function getUserId() {
    // Try sessionStorage first (cleared when browser closes)
    let userId = sessionStorage.getItem('userId');
    
    // Then try localStorage (persists across sessions)
    if (!userId) {
        userId = localStorage.getItem('userId');
    }
    
    // Finally check URL parameters
    if (!userId) {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get('userId');
    }
    
    console.log("Using userId:", userId);
    return userId;
}

async function fetchUserProfile(userId) {
    try {
        console.log("Fetching profile for userId:", userId);
        
        // First check if we have a valid user ID
        if (!userId || !isValidObjectId(userId)) {
            throw new Error("Invalid user ID format");
        }

        const response = await fetch(`/api/profile/${userId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const { success, data, error } = await response.json();
        
        if (!success) {
            throw new Error(error || "Failed to fetch profile");
        }

        populateProfile(data);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showErrorMessage(error.message || "Failed to load profile data. Please try again.");
    }
}

function populateProfile(userData) {
    if (!userData) {
        console.error('Invalid user data: null or undefined');
        showErrorMessage("No profile data received from server");
        return;
    }

    // Check if personalInfo exists or use the root object
    const personalInfo = userData.personalInfo || userData;
    
    // Update profile header
    const nameElement = document.getElementById("user-name");
    if (nameElement) {
        nameElement.innerText = `${personalInfo.firstname || ''} ${personalInfo.middlename || ''} ${personalInfo.lastname || ''} ${personalInfo.suffix || ''}`.trim().replace(/\s+/g, ' ');
    }
    
    const occupationElement = document.getElementById("user-occupation");
    if (occupationElement) {
        occupationElement.innerText = personalInfo.occupation || 'Not specified';
    }
    
    const emailElement = document.getElementById("user-email");
    if (emailElement) {
        emailElement.innerHTML = `<i class="fa-solid fa-envelope"></i> ${personalInfo.emailAddress || personalInfo.email || 'N/A'}`;
    }

    const fieldMappings = {
        "first-name": "firstname",
        "middle-name": "middlename",
        "last-name": "lastname",
        "suffix": "suffix",
        "gender": "gender",
        "age": "age",
        "occupation": "occupation",
        "nationality": "nationality",
        "civil-status": "civilstatus",
        "birthday": "birthDate",
        "birth-place": "birthplace",
        "phone": "mobileNumber",
        "telephone": "telephoneNumber",
        "email": "emailAddress",
        "country": "country",
        "province": "province",
        "city": "city",
        "street": "street",
        "zip-code": "zipCode",
        "first-priority": "firstPriorityCourse",
        "second-priority": "secondPriorityCourse",
        "third-priority": "thirdPriorityCourse"
    };

    for (const [htmlId, dataKey] of Object.entries(fieldMappings)) {
        const element = document.getElementById(htmlId);
        if (element) {
            // Get the value from personalInfo or root object
            let value = personalInfo[dataKey] || userData[dataKey] || 'N/A';
            
            // Format birthDate to remove time component if this is the birthday field
            if (dataKey === "birthDate" && value !== 'N/A') {
                try {
                    // Try to format the date (works for ISO strings and valid date formats)
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                    }
                } catch (e) {
                    console.warn("Could not format birthDate:", e);
                }
            }
            
            element.innerText = value;
        }
    }
}

function setupEventListeners() {
    const logoutButton = document.querySelector("#logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            logoutUser();
        });
    }

    // Setup dropdown toggles
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
    dropdownToggles.forEach((toggle) => {
        toggle.addEventListener("click", function (event) {
            event.preventDefault();
            const parentDropdown = toggle.parentElement;
            parentDropdown.classList.toggle("active");

            // Close other dropdowns
            document.querySelectorAll(".dropdown").forEach((dropdown) => {
                if (dropdown !== parentDropdown) {
                    dropdown.classList.remove("active");
                }
            });
        });
    });

    // Close dropdowns if clicked outside
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".dropdown")) {
            document.querySelectorAll(".dropdown").forEach((dropdown) => {
                dropdown.classList.remove("active");
            });
        }
    });

    // Setup edit buttons
    document.querySelectorAll(".edit-button").forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            toggleSectionEdit(this);
        });
    });

    // Setup profile edit button
    const profileEditButton = document.querySelector(".edit-profile-button");
    if (profileEditButton) {
        profileEditButton.addEventListener("click", function (event) {
            event.preventDefault();
            toggleProfileEdit(this);
        });
    }
}

async function logoutUser() {
    try {
        const response = await fetch('/applicant/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            // Clear frontend storage
            sessionStorage.clear();
            localStorage.clear();
            
            // Redirect to login page
            window.location.href = "../Login/login.html";
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showErrorMessage("Failed to logout. Please try again.");
    }
}

function createDropdown(options, currentValue, excludedValues = []) {
    const select = document.createElement("select");
    select.classList.add("edit-input");
    options.forEach(option => {
        if (!excludedValues.includes(option)) {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.innerText = option;
            if (option === currentValue) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        }
    });
    return select;
}

function getSelectedCourses() {
    return Array.from(document.querySelectorAll(".info-item span select"))
        .map(select => select.value);
}

function initializePhoneInput(input) {
    if (!input) return null;

    const phoneError = document.createElement("span");
    phoneError.style.color = "red";
    phoneError.style.display = "none";
    phoneError.classList.add("phone-error");
    input.parentNode.appendChild(phoneError);

    const itiPhone = intlTelInput(input, {
        separateDialCode: true,
        initialCountry: "auto",
        geoIpLookup: callback => {
            fetch("https://ipinfo.io/json?token=YOUR_TOKEN")
                .then(response => response.json())
                .then(data => callback(data.country))
                .catch(() => callback(""));
        },
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
    });

    itiPhone.promise.then(() => {
        const dialCode = `+${itiPhone.getSelectedCountryData().dialCode} `;
        input.value = dialCode;
    });

    input.addEventListener("input", function () {
        const dialCode = `+${itiPhone.getSelectedCountryData().dialCode} `;
        if (!input.value.startsWith(dialCode)) {
            input.value = dialCode;
        }

        if (itiPhone.isValidNumber()) {
            phoneError.style.display = "none";
        } else {
            phoneError.innerText = "Invalid phone number.";
            phoneError.style.display = "block";
        }
    });

    return { input, itiPhone, phoneError };
}

function toggleProfileEdit(button) {
    const profileInfo = document.querySelector(".profile-info");
    const nameField = profileInfo.querySelector("h1");
    const jobTitleField = profileInfo.querySelector(".job-title");
    const locationField = profileInfo.querySelector(".location");
    const profilePic = document.querySelector(".profile-pic");
    const profilePicUpload = document.querySelector(".profile-pic-upload");
    const profilePicContainer = document.querySelector(".profile-pic-container");

    const isEditing = button.classList.contains("edit-mode");

    if (isEditing) {
        nameField.innerText = nameField.querySelector("input").value;
        jobTitleField.innerText = jobTitleField.querySelector("input").value;
        locationField.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${locationField.querySelector("input").value}`;

        button.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
        profilePicContainer.classList.remove("edit-mode");
    } else {
        nameField.innerHTML = `<input type="text" class="edit-input" value="${nameField.innerText}">`;
        jobTitleField.innerHTML = `<input type="text" class="edit-input" value="${jobTitleField.innerText}">`;
        locationField.innerHTML = `<i class="fa-solid fa-location-dot"></i> <input type="text" class="edit-input" value="${locationField.innerText.trim()}">`;

        profilePicUpload.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profilePic.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        button.innerHTML = '<i class="fa-solid fa-save"></i> Save Profile';
        profilePicContainer.classList.add("edit-mode");
    }

    button.classList.toggle("edit-mode");
}

function toggleSectionEdit(button) {
    const section = button.closest(".section");
    const infoItems = section.querySelectorAll(".info-item span:last-child");
    const isEditing = button.classList.contains("edit-mode");

    let phoneInputInstance = null;
    let hasError = false;

    if (isEditing) {
        infoItems.forEach(item => {
            const input = item.querySelector("input, select");
            if (input) {
                const fieldName = item.previousElementSibling.innerText.trim();

                if (!input.value.trim() && fieldName !== "Suffix:" && fieldName !== "Telephone:") {
                    input.style.border = "1px solid red";
                    hasError = true;
                } else {
                    input.style.border = "";
                    item.innerText = input.value;
                }

                if (fieldName === "Phone:" && input.type === "tel") {
                    const phoneError = item.querySelector(".phone-error");
                    if (!input.value.trim() || !phoneInputInstance.itiPhone.isValidNumber()) {
                        input.style.border = "1px solid red";
                        phoneError.innerText = "Please enter a valid phone number.";
                        phoneError.style.display = "block";
                        hasError = true;
                    } else {
                        phoneError.style.display = "none";
                    }
                }
            }
        });

        if (hasError) {
            showErrorMessage("Please fill in all required fields before saving.");
            return;
        }
    } else {
        infoItems.forEach(item => {
            const currentValue = item.innerText.trim();
            let inputElement;

            if (item.previousElementSibling.innerText === "Gender:") {
                inputElement = createDropdown(["Male", "Female", "Other"], currentValue);
            } else if (item.previousElementSibling.innerText === "Civil Status:") {
                inputElement = createDropdown(["Single", "Married", "Divorced", "Widowed"], currentValue);
            } else if (item.previousElementSibling.innerText.includes("Priority")) {
                const selectedCourses = getSelectedCourses();
                inputElement = createDropdown([
                    "BS Information Technology", "BS Entrepreneurship", "BS Office Administration",
                    "BSBA Operations Management", "BSBA Marketing Management", "BSBA Financial Management",
                    "BSBA Human Resource Management", "BS Political Science", "BS Statistics",
                    "BS Biology", "BS Astronomy"
                ], currentValue, selectedCourses);

                inputElement.addEventListener("change", () => {
                    document.querySelectorAll(".edit-button").forEach(btn => {
                        if (btn.classList.contains("edit-mode")) {
                            toggleSectionEdit(btn);
                            toggleSectionEdit(btn);
                        }
                    });
                });
            } else if (item.previousElementSibling.innerText === "Birthday:") {
                inputElement = document.createElement("input");
                inputElement.type = "date";
                inputElement.classList.add("edit-input");
                inputElement.value = currentValue;
            } else if (item.previousElementSibling.innerText === "Phone:") {
                inputElement = document.createElement("input");
                inputElement.type = "tel";
                inputElement.classList.add("edit-input");
                inputElement.id = "phone";
                inputElement.value = currentValue;

                item.innerHTML = "";
                item.appendChild(inputElement);
                phoneInputInstance = initializePhoneInput(inputElement);
                return;
            } else {
                inputElement = document.createElement("input");
                inputElement.type = "text";
                inputElement.classList.add("edit-input");
                inputElement.value = currentValue;
            }
            item.innerHTML = "";
            item.appendChild(inputElement);
        });
    }

    button.innerHTML = isEditing ? '<i class="fa-solid fa-pen"></i> Edit'
                                 : '<i class="fa-solid fa-save"></i> Save';
    button.classList.toggle("edit-mode");
}