document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector("#logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();

            //  Clear frontend session data
            sessionStorage.clear();
            localStorage.removeItem("userSession");

            //  Redirect to home page
            window.location.href = "../Login/login.html";
        });
    }

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
});

document.addEventListener("DOMContentLoaded", function() {
    const resultLink = document.getElementById('result-link');
    const passedStep = resultLink.closest('li');

    if (passedStep.classList.contains('step-todo')) {
        resultLink.setAttribute('href', '#'); // Disable the link
        resultLink.style.pointerEvents = 'none'; // Disable pointer events
        resultLink.style.color = '#ccc'; // Optionally change color to indicate it's disabled
    }
});