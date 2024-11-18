document.getElementById("logoutBtn")?.addEventListener("click", () => {
    alert("Logged out!");
    window.location.href = "index.html";
});

// Task creation form handler
document.getElementById("taskCreationForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Task created successfully!");
    // Add logic to dynamically update task list
});
