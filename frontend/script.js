// 🌐 Backend URL
const BASE_URL = "http://127.0.0.1:5000";


// ==========================
// 🧍 USER REGISTRATION
// ==========================
async function register() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;

  if (!name || !phone || !password) {
    alert("Please fill all fields!");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password })
    });

    const data = await response.json();
    alert(data.message);

    if (response.status === 201) {
      // ✅ After registration, redirect back to home page for login
      window.location.href = "home.html";
    }
  } catch (error) {
    alert("Error: Could not register user.");
    console.error(error);
  }
}


// ==========================
// 👤 USER LOGIN
// ==========================
async function login() {
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;

  if (!phone || !password) {
    alert("Please enter both phone number and password!");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password })
    });

    const data = await res.json();
    alert(data.message);

    if (res.status === 200) {
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "profile.html"; // Redirect to user profile
    }
  } catch (error) {
    alert("Error: Unable to login user.");
    console.error(error);
  }
}


// ==========================
// 🧾 ADMIN REGISTRATION (with unique ID)
// ==========================
async function adminRegister() {
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;

  if (!name || !password) {
    alert("Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/admin_register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });

    //const data = await res.json();
    //alert(`${data.message}\nYour Admin ID: ${data.admin_id}`);

    if (res.status === 201) {
      // ✅ Redirect to Home Page for admin login
      window.location.href = "home.html";
    }
  } catch (error) {
    alert("Error: Could not register admin.");
    console.error(error);
  }
}


// ==========================
// 🧑‍💼 ADMIN LOGIN (Using Admin ID)
// ==========================
async function adminLogin() {
  const admin_id = document.getElementById("adminId").value;
  const password = document.getElementById("password").value;

  if (!admin_id || !password) {
    alert("Please enter Admin ID and password!");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/admin_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_id, password })
    });

    const data = await res.json();
    alert(data.message);

    if (res.status === 200) {
      localStorage.setItem("admin", JSON.stringify(data.admin));
      window.location.href = "admin_panel.html";
    }
  } catch (error) {
    alert("Error: Unable to login admin.");
    console.error(error);
  }
}


// ==========================
// 🧠 ADMIN ASSIGN TASK TO USER
// ==========================
async function assignTask() {
  const user_id = document.getElementById("userId").value;
  const task_title = document.getElementById("taskTitle").value;
  const task_desc = document.getElementById("taskDesc").value;

  if (!user_id || !task_title) {
    alert("Please fill all required fields!");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/assign_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, task_title, task_desc })
    });

    const data = await res.json();
    alert(data.message);
  } catch (error) {
    alert("Error: Could not assign task.");
    console.error(error);
  }
}


// ==========================
// 📋 USER DASHBOARD: SHOW TASKS
// ==========================
async function loadUserTasks() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please login first!");
    window.location.href = "home.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/tasks/${user.id}`);
    const tasks = await res.json();
    const taskDiv = document.getElementById("taskList");

    if (tasks.length === 0) {
      taskDiv.innerHTML = "<p>No tasks assigned yet.</p>";
    } else {
      taskDiv.innerHTML = tasks
        .map(
          (t, i) =>
            `<div class="task">
              <strong>Task ${i + 1}:</strong> ${t.title}<br>
              <small>${t.desc || ""}</small>
            </div><hr>`
        )
        .join("");
        
    }
  } catch (error) {
    alert("Error: Could not load tasks.");
    console.error(error);
  }
}


// ==========================
// 🚪 LOGOUT FUNCTIONS
// ==========================
function logoutUser() {
  localStorage.removeItem("user");
  window.location.href = "home.html";
}

function logoutAdmin() {
  localStorage.removeItem("admin");
  window.location.href = "home.html";
}
// ==========================
// 👩‍💼 ADMIN: LOAD ALL USERS
// ==========================
async function loadAllUsers() {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) {
    alert("Please login as admin!");
    window.location.href = "home.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/users`);
    const users = await res.json();
    const container = document.getElementById("userList");

    if (users.length === 0) {
      container.innerHTML = "<p>No registered users yet.</p>";
      return;
    }

    container.innerHTML = users
  .map(
    (u) => `
      <div class="user-card">
        <img src="${u.photo ? u.photo.replace('uploads', '../backend/uploads') : 'https://via.placeholder.com/80'}" 
             alt="Profile" 
             style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:10px;">
        <h3>${u.name}</h3>
        <p>📞 ${u.phone}</p>
        <p>🏠 ${u.address || "N/A"}</p>
        <p>🎂 ${u.dob || "N/A"}</p>
        <p>🆔 ${u.id}</p>
        <button class="assign-btn" onclick="showTaskBox('${u.id}')">Assign Task</button>
        <button class="view-btn" onclick="viewTasks('${u.id}')">View Tasks</button>

        <div class="task-section" id="task-${u.id}">
          <input type="text" id="taskTitle-${u.id}" placeholder="Task Title">
          <textarea id="taskDesc-${u.id}" placeholder="Task Description"></textarea>
          <button onclick="assignTaskToUser('${u.id}')">Submit Task</button>
        </div>
      </div>`
  )
  .join("");

  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Toggle task input box
function showTaskBox(userId) {
  const box = document.getElementById(`task-${userId}`);
  box.style.display = box.style.display === "block" ? "none" : "block";
}

// Assign task directly to selected user
async function assignTaskToUser(userId) {
  const task_title = document.getElementById(`taskTitle-${userId}`).value;
  const task_desc = document.getElementById(`taskDesc-${userId}`).value;

  if (!task_title) {
    alert("Please enter a task title!");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/assign_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, task_title, task_desc })
    });

    const data = await res.json();
    alert(data.message);
    document.getElementById(`task-${userId}`).style.display = "none";
  } catch (error) {
    console.error("Error assigning task:", error);
    alert("Error assigning task");
  }
}

// ==========================
// 📊 LOAD DASHBOARD STATS
// ==========================
async function loadDashboardStats() {
  try {
    const res = await fetch(`${BASE_URL}/stats`);
    const data = await res.json();

    document.getElementById("totalUsers").textContent = data.total_users;
    document.getElementById("totalTasks").textContent = data.total_tasks;
    document.getElementById("completedTasks").textContent = data.completed;
    document.getElementById("pendingTasks").textContent = data.pending;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }
}


async function markTaskCompleted(taskIndex) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please login first");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/complete_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, task_index: taskIndex })
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "Task updated");
      // reload tasks and optionally refresh admin stats if admin is open
      loadTasks();               // user page reload
    } else {
      alert(data.message || "Error updating task.");
      console.error("Complete task error:", data);
    }
  } catch (err) {
    alert("Error updating task.");
    console.error(err);
  }
}
