document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-upload");
    const dropArea = document.querySelector(".upload");
    const fileList = document.getElementById("file-list");
    let uploadedFiles = new Set(); // Track unique files

    function handleFiles(files) {
        if (files.length === 0) return; // Prevent empty uploads

        Array.from(files).forEach(file => {
            if (file.size > 25 * 1024 * 1024) {
                alert(`File "${file.name}" exceeds the 25MB limit.`);
                return;
            }

            if (uploadedFiles.has(file.name)) {
                alert(`File "${file.name}" is already uploaded.`);
                return;
            }

            uploadedFiles.add(file.name); // Track uploaded file names

            const fileItem = document.createElement("div");
            fileItem.classList.add("file-item");

            const fileName = document.createElement("p");
            fileName.classList.add("file-name");
            fileName.textContent = file.name;

            // Create Remove Button
            const removeButton = document.createElement("button");
            removeButton.textContent = "x";
            removeButton.classList.add("remove-btn");

            // Remove file from the list and Set
            removeButton.onclick = function () {
                fileItem.remove();
                uploadedFiles.delete(file.name);
            };

            if (file.type.startsWith("image/")) {
                const filePreview = document.createElement("img");
                filePreview.classList.add("file-preview");
                filePreview.src = URL.createObjectURL(file);
                fileItem.appendChild(filePreview);
            }

            fileItem.appendChild(fileName);
            fileList.appendChild(fileItem);
            fileItem.appendChild(removeButton);
        });
    }

    // Handle file input change event
    fileInput.addEventListener("change", function () {
        handleFiles(this.files);
    });

    // Drag & Drop Events
    ["dragenter", "dragover"].forEach(event => {
        dropArea.addEventListener(event, (e) => {
            e.preventDefault();
            dropArea.style.boxShadow = "0 0 10px rgba(83, 41, 137, 0.5)";
        });
    });

    ["dragleave", "drop"].forEach(event => {
        dropArea.addEventListener(event, (e) => {
            e.preventDefault();
            dropArea.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
        });
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    });

    // Prevent file manager from popping up twice
    dropArea.addEventListener("click", (e) => {
        if (e.target === dropArea) {
            fileInput.dispatchEvent(new MouseEvent("click", { bubbles: false }));
        }
    });

    // Course Selection Logic (Prevent Duplicates in Priorities)
    function updateDropdowns() {
        let selectedValues = new Set();

        // Get selected values from all dropdowns
        document.querySelectorAll("select").forEach(select => {
            if (select.value) {
                selectedValues.add(select.value);
            }
        });

        // Enable all options first
        document.querySelectorAll("select option").forEach(option => {
            option.hidden = false;
        });

        // Disable already selected options in other dropdowns
        document.querySelectorAll("select").forEach(select => {
            let selected = select.value;
            select.querySelectorAll("option").forEach(option => {
                if (selectedValues.has(option.value) && option.value !== selected) {
                    option.hidden = true;
                }
            });
        });
    }

    document.querySelectorAll("select").forEach(select => {
        select.addEventListener("change", updateDropdowns);
    });

    // Initialize International Telephone Input
    var input = document.querySelector("#mobile-number");
    var iti = window.intlTelInput(input, {
        initialCountry: "auto",
        geoIpLookup: function(callback) {
            fetch('https://ipinfo.io?token=YOUR_TOKEN')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    callback(data.country);
                });
        },
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js",
        nationalMode: false, // Include country code in the input field
        formatOnDisplay: true, // Enable custom formatting
        customPlaceholder: function(selectedCountryPlaceholder, selectedCountryData) {
            return "(" + selectedCountryData.dialCode + ") ";
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const personalForm = document.getElementById("personalForm");

    personalForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("authToken");

        const personalInfo = {
            firstname: document.getElementById("firstname").value,
            middlename: document.getElementById("middlename").value,
            lastname: document.getElementById("lastname").value,
            suffix: document.getElementById("suffix").value,
            gender: document.getElementById("gender").value,
            age: parseInt(document.getElementById("age").value) || 0,
            occupation: document.getElementById("occupation").value,
            nationality: document.getElementById("nationality").value,
            civilstatus: document.getElementById("civilstatus").value,
            birthDate: document.getElementById("birth-date").value,
            birthplace: document.getElementById("birthplace").value,
            mobileNumber: document.getElementById("mobile-number").value,
            telephoneNumber: document.getElementById("telephone-number").value,
            emailAddress: document.getElementById("email-address").value,
            country: document.getElementById("country").value,
            province: document.getElementById("province").value,
            city: document.getElementById("city").value,
            street: document.getElementById("street").value,
            zipCode: document.getElementById("zip-code").value,
            firstPriorityCourse: document.getElementById("First-prio").value,
            secondPriorityCourse: document.getElementById("second-prio").value,
            thirdPriorityCourse: document.getElementById("third-prio").value
        };

        const files = document.getElementById("file-upload").files;

        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("personalInfo", JSON.stringify(personalInfo));

        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        try {
            const headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch("http://localhost:3000/api/update-personal-info", {
                method: "POST",
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Error updating personal info");
            }

            const data = await response.json();
            alert("Personal information updated successfully!");

            // Debugging statement to confirm redirection
            console.log("Redirecting to login page...");
            window.location.href = "/frontend/Applicant/Login/login.html";
        } catch (error) {
            console.error("Error updating personal info:", error);
            alert("An error occurred. Please try again.");
        }
    });
});