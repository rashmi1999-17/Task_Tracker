from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import users_collection
from bson import ObjectId
import bcrypt
import random
import string
import os
from werkzeug.utils import secure_filename

from flask import request, jsonify
from bson import ObjectId

app = Flask(__name__)
#CORS(app, supports_credentials=True)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ----------------------------
# Helper: Generate Unique Admin ID
# ----------------------------
def generate_admin_id():
    return "ADM" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


# ----------------------------
# USER REGISTRATION
# ----------------------------
@app.route('/register', methods=['POST'])
def register_user():
    # Handle form-data (text + file)
    name = request.form.get("name")
    phone = request.form.get("phone")
    address = request.form.get("address")
    dob = request.form.get("dob")
    password = request.form.get("password")

    # File Upload
    profile_photo = request.files.get("profile_photo")
    photo_filename = None
    if profile_photo:
        filename = secure_filename(profile_photo.filename)
        photo_filename = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        profile_photo.save(photo_filename)

    # Duplicate check
    if users_collection.find_one({"phone": phone}):
        return jsonify({"message": "Phone already registered"}), 400

    # Generate a 6-digit numeric password (auto or from name+phone)
    seed = name + phone
    generated_pw = str(abs(hash(seed)))[:6]

    user = {
        "name": name,
        "phone": phone,
        "address": address,
        "dob": dob,
        "profile_photo": photo_filename,
        "password": generated_pw,
        "role": "user",
        "tasks": []
    }

    users_collection.insert_one(user)

    return jsonify({
        "message": "User registered successfully!",
        "generated_password": generated_pw
    }), 201



# ----------------------------
# ADMIN REGISTRATION (Generates Unique ID)
# ----------------------------
@app.route('/admin_register', methods=['POST'])
def register_admin():
    data = request.json
    name = data.get("name")
    password = data.get("password")

    # Generate unique Admin ID
    admin_id = generate_admin_id()

    # Store admin password as PLAIN text (easy login)
    admin = {
        "name": name,
        "admin_id": admin_id,
        "password": password,
        "role": "admin"
    }

    users_collection.insert_one(admin)
    return jsonify({
        "message": "Admin registered successfully",
        "admin_id": admin_id
    }), 201



# ----------------------------
# USER LOGIN
# ----------------------------
@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    phone = data.get("phone")
    password = data.get("password")

    user = users_collection.find_one({"phone": phone, "role": "user"})
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Convert both to string to ensure matching (since stored password is numeric string)
    if str(password) == str(user["password"]):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "phone": user["phone"],
                "address": user.get("address", ""),
                "dob": user.get("dob", ""),
                "profile_photo": user.get("profile_photo", "")
            }
        }), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

# ----------------------------
# ADMIN ASSIGN TASK
# ----------------------------
@app.route('/assign_task', methods=['POST'])
def assign_task():
    data = request.json
    user_id = data.get("user_id")
    task_title = data.get("task_title")
    task_desc = data.get("task_desc")

    users_collection.update_one(
        {"_id": ObjectId(user_id), "role": "user"},
        {"$push": {"tasks": {"title": task_title, "desc": task_desc, "status": "pending"}}}
    )
    return jsonify({"message": "Task assigned successfully"}), 200


# ----------------------------
# USER VIEW TASKS
# ----------------------------
@app.route('/tasks/<user_id>', methods=['GET'])
def get_tasks(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"tasks": 1, "_id": 0})
    if user:
        return jsonify(user["tasks"]), 200
    return jsonify({"message": "User not found"}), 404


# ----------------------------
# ADMIN: Get All Users
# ----------------------------
@app.route('/users', methods=['GET'])
def get_all_users():
    users = users_collection.find({"role": "user"}, {"name": 1, "phone": 1, "address": 1, "dob": 1, "profile_photo": 1})
    user_list = []
    for user in users:
        user_list.append({
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "phone": user.get("phone", ""),
            "address": user.get("address", ""),
            "dob": user.get("dob", ""),
            "photo": user.get("profile_photo", "")
        })
    return jsonify(user_list), 200

# ----------------------------
# ADMIN DASHBOARD STATS
# ----------------------------
@app.route('/stats', methods=['GET'])
def get_stats():
    total_users = users_collection.count_documents({"role": "user"})
    users = users_collection.find({"role": "user"}, {"tasks": 1})
    total_tasks = 0
    completed = 0
    pending = 0

    for user in users:
        if "tasks" in user:
            for task in user["tasks"]:
                total_tasks += 1
                if task.get("status") == "completed":
                    completed += 1
                else:
                    pending += 1

    return jsonify({
        "total_users": total_users,
        "total_tasks": total_tasks,
        "completed": completed,
        "pending": pending
    }), 200

@app.route('/admin_login', methods=['POST'])
def admin_login():
    data = request.json
    admin_id = data.get("admin_id")
    password = data.get("password")

    admin = users_collection.find_one({"admin_id": admin_id, "role": "admin"})
    if not admin:
        return jsonify({"message": "Admin not found"}), 404

    if password == admin["password"]:
        return jsonify({
            "message": "Admin login successful",
            "admin": {
                "id": str(admin["_id"]),
                "admin_id": admin["admin_id"],
                "name": admin["name"]
            }
        }), 200

    return jsonify({"message": "Invalid admin credentials"}), 401

# ----------------------------
# USER MARK TASK AS COMPLETED
# ----------------------------
@app.route('/complete_task', methods=['POST', 'OPTIONS'])
def complete_task():
    # handle CORS preflight (safe for local dev)
    if request.method == 'OPTIONS':
        resp = jsonify({"message": "CORS preflight"})
        resp.headers.add("Access-Control-Allow-Origin", "*")
        resp.headers.add("Access-Control-Allow-Headers", "Content-Type")
        resp.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return resp, 200

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"message": "Invalid JSON"}), 400

    user_id = data.get("user_id")
    task_index = data.get("task_index")

    if user_id is None or task_index is None:
        return jsonify({"message": "Missing user_id or task_index"}), 400

    try:
        task_index = int(task_index)
    except:
        return jsonify({"message": "task_index must be an integer"}), 400

    # First try to find by short user_id field (USRxxxxx)
    user = users_collection.find_one({"user_id": user_id})
    # If not found, try treating user_id as ObjectId
    if not user:
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None

    if not user:
        return jsonify({"message": "User not found"}), 404

    tasks = user.get("tasks", [])
    if task_index < 0 or task_index >= len(tasks):
        return jsonify({"message": "Invalid task index"}), 400

    # Update in-memory list then set the whole tasks array
    tasks[task_index]["status"] = "completed"
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"tasks": tasks}})

    return jsonify({"message": "Task marked as completed!"}), 200

# ----------------------------
# MAIN ENTRY POINT
# ----------------------------
if __name__ == '__main__':
    app.run(debug=True)
