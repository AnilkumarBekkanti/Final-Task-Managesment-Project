// Add this at the beginning of your dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Get username from localStorage
    const username = localStorage.getItem('username');
    
    // Update the username display
    if (username) {
        document.getElementById('username').textContent = username;
    } else {
        // Redirect to login if no username found
        window.location.href = 'login.html';
    }
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return token;
}

// Add new task
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const taskData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        deadline: document.getElementById('deadline').value,
        status: 'yet-to-start'
    };

    console.log('Sending task data:', taskData);

    try {
        const response = await fetch('http://127.0.0.1:8000/api/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();
        console.log('Response:', data);

        if (response.ok) {
            alert('Task created successfully!');
            document.getElementById('taskForm').reset();
            fetchTasks();
        } else {
            throw new Error(data.detail || 'Failed to create task');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
});

// Fetch and display tasks
async function fetchTasks() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/tasks/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }

        const tasks = await response.json();
        displayTasks(tasks);
        updateDashboardStats(tasks);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Display tasks in table
function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = tasks.map(task => `
        <tr class="task-status-${task.status}">
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td><span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span></td>
            <td>
                <select class="form-control status-select" onchange="updateTaskStatus(${task.id}, this.value)">
                    <option value="yet-to-start" ${task.status === 'yet-to-start' ? 'selected' : ''}>Yet to Start</option>
                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="hold" ${task.status === 'hold' ? 'selected' : ''}>Hold</option>
                </select>
            </td>
            <td>${formatDate(task.deadline)}</td>
            <td>
                <button class="btn btn-primary btn-sm me-2" onclick="openEditModal(${task.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Update dashboard statistics
function updateDashboardStats(tasks) {
    const stats = {
        total: tasks.length,
        completed: tasks.filter(task => task.status === 'completed').length,
        inProgress: tasks.filter(task => task.status === 'in-progress').length,
        highPriority: tasks.filter(task => task.priority === 'high').length
    };

    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.completed;
    document.getElementById('inProgressTasks').textContent = stats.inProgress;
    document.getElementById('highPriorityTasks').textContent = stats.highPriority;

    // Add these console logs for debugging
    console.log('Tasks Statistics:', {
        total: stats.total,
        completed: stats.completed,
        inProgress: stats.inProgress,
        highPriority: stats.highPriority
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// Delete task function
async function deleteTask(taskId) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Task deleted successfully!');
            // Refresh the task list
            fetchTasks();
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to delete task');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting task: ' + error.message);
    }
}

// Add edit modal functions
async function openEditModal(taskId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const task = await response.json();
        
        // Populate modal fields
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editDescription').value = task.description;
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editDeadline').value = task.deadline;
        
        // Show modal
        const editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        editModal.show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading task details');
    }
}

// Add save edit function
async function saveTaskEdit() {
    const token = localStorage.getItem('token');
    const taskId = document.getElementById('editTaskId').value;
    
    const taskData = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        priority: document.getElementById('editPriority').value,
        deadline: document.getElementById('editDeadline').value
    };

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            // Close modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            editModal.hide();
            
            // Refresh task list
            fetchTasks();
            alert('Task updated successfully!');
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to update task');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating task: ' + error.message);
    }
}

// Update the updateTaskStatus function
async function updateTaskStatus(taskId, newStatus) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // First, get the current task data
        const getResponse = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!getResponse.ok) {
            throw new Error('Failed to fetch task details');
        }
        
        const currentTask = await getResponse.json();
        
        // Update the status while keeping other fields
        const updatedTask = {
            ...currentTask,
            status: newStatus
        };

        // Send PUT request with all task data
        const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedTask)
        });

        if (response.ok) {
            fetchTasks(); // Refresh the task list and statistics
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to update task status');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating task status: ' + error.message);
    }
}

// Add these helper functions
function getPriorityBadgeClass(priority) {
    const classes = {
        'high': 'bg-danger',
        'medium': 'bg-warning',
        'low': 'bg-info'
    };
    return classes[priority] || 'bg-secondary';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}
