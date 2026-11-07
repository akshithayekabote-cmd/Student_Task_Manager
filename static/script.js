
async function loadTasks() {

    const response = await fetch("/api/tasks");
    const tasks = await response.json();

    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    // Update dashboard counters

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed === 1
    ).length;

    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;

    if (tasks.length === 0) {
        taskList.textContent = "No tasks added yet.";
        return;
    }

    // Display all tasks

    tasks.forEach(task => {

        const taskDiv = document.createElement("div");
        taskDiv.className = "task";

        if (task.completed) {
            taskDiv.classList.add("completed");
        }

        const title = document.createElement("h3");
        title.textContent = task.title;

        const priority = document.createElement("span");
        priority.className = "priority " + task.priority.toLowerCase();
        priority.textContent = task.priority + " Priority";

        const date = document.createElement("p");
        date.textContent = "Due Date: " +
            (task.due_date || "Not selected");

        const completeButton = document.createElement("button");

        completeButton.textContent = task.completed
            ? "Mark Pending"
            : "Complete";

        completeButton.onclick = () => completeTask(task.id);

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = () => editTask(task);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteTask(task.id);

        taskDiv.appendChild(title);
        taskDiv.appendChild(priority);
        taskDiv.appendChild(date);
        taskDiv.appendChild(completeButton);
        taskDiv.appendChild(editButton);
        taskDiv.appendChild(deleteButton);

        taskList.appendChild(taskDiv);

    });
}


// Add a new task

async function addTask() {

    const taskInput = document.getElementById("taskInput");
    const priority = document.getElementById("priority");
    const dueDate = document.getElementById("dueDate");

    const taskName = taskInput.value.trim();

    if (taskName === "") {
        alert("Please enter a task!");
        return;
    }

    const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: taskName,
            priority: priority.value,
            due_date: dueDate.value
        })
    });

    if (!response.ok) {
        alert("Unable to add task.");
        return;
    }

    taskInput.value = "";
    dueDate.value = "";

    loadTasks();
}


// Edit a task

async function editTask(task) {

    const newTitle = prompt("Enter new task name:", task.title);

    if (newTitle === null || newTitle.trim() === "") {
        return;
    }

    const newPriority = prompt(
        "Enter priority: Low, Medium or High",
        task.priority
    );

    if (newPriority === null) {
        return;
    }

    const priority = newPriority.trim().toLowerCase();

    if (!["low", "medium", "high"].includes(priority)) {
        alert("Enter Low, Medium or High.");
        return;
    }

    const newDate = prompt(
        "Enter due date (YYYY-MM-DD):",
        task.due_date || ""
    );

    if (newDate === null) {
        return;
    }

    const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: newTitle.trim(),
            priority: priority.charAt(0).toUpperCase() +
                priority.slice(1),
            due_date: newDate
        })
    });

    if (!response.ok) {
        alert("Unable to update task.");
        return;
    }

    loadTasks();
}


// Delete a task

async function deleteTask(id) {

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Unable to delete task.");
        return;
    }

    loadTasks();
}


// Mark task as completed or pending

async function completeTask(id) {

    const response = await fetch(`/api/tasks/${id}/complete`, {
        method: "PATCH"
    });

    if (!response.ok) {
        alert("Unable to update task.");
        return;
    }

    loadTasks();
}


// Load tasks when website opens

loadTasks();
