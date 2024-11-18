// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return token;
}

// Fetch tasks
async function fetchTasks() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/tasks/', {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(response);
        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
            updateDashboardStats(tasks);
        } else {
            console.error('Failed to fetch tasks');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Add Task
document.getElementById("taskForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const token = checkAuth();
    if (!token) return;

    const taskData = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        priority: document.getElementById("priority").value.toLowerCase(),
        status: document.getElementById("status").value.toLowerCase(),
        deadline: document.getElementById("deadline").value
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            alert("Task added successfully!");
            document.getElementById("taskForm").reset();
            fetchTasks();
        } else {
            const data = await response.json();
            alert(data.detail || "Failed to add task");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error adding task");
    }
});

// Delete Task
async function deleteTask(taskId) {
    const token = checkAuth();
    if (!token) return;

    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Task deleted successfully!");
            fetchTasks();
        } else {
            alert("Failed to delete task");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error deleting task");
    }
}

// Update Task Status
async function updateStatus(taskId, newStatus) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            fetchTasks();
        } else {
            alert("Failed to update task status");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error updating task status");
    }
}

// Display Tasks
function displayTasks(tasks) {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = tasks.map(task => `
        <tr>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.priority}</td>
            <td>
                <select class="form-control statusSelect" onchange="updateStatus(${task.id}, this.value)">
                    <option value="yet-to-start" ${task.status === "yet-to-start" ? "selected" : ""}>Yet to Start</option>
                    <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
                    <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                    <option value="hold" ${task.status === "hold" ? "selected" : ""}>Hold</option>
                </select>
            </td>
            <td>${task.deadline}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editTask(${task.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}

// Initialize
fetchTasks();


