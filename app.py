
from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)

DATABASE = os.path.join(app.root_path, "tasks.db")


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            priority TEXT NOT NULL,
            due_date TEXT,
            completed INTEGER DEFAULT 0
        )
    """)

    connection.commit()
    connection.close()


@app.route("/")
def home():
    return render_template("index.html")


# Display all tasks
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    connection = get_db_connection()

    tasks = connection.execute(
        "SELECT * FROM tasks ORDER BY id DESC"
    ).fetchall()

    connection.close()

    return jsonify([dict(task) for task in tasks])


# Add a new task
@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json()

    title = data.get("title", "").strip()
    priority = data.get("priority", "Low")
    due_date = data.get("due_date", "")

    if not title:
        return jsonify({"error": "Task name is required"}), 400

    if priority not in ["Low", "Medium", "High"]:
        return jsonify({"error": "Invalid priority"}), 400

    connection = get_db_connection()

    connection.execute(
        "INSERT INTO tasks (title, priority, due_date) VALUES (?, ?, ?)",
        (title, priority, due_date)
    )

    connection.commit()
    connection.close()

    return jsonify({"message": "Task added successfully"}), 201


# Edit an existing task
@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def edit_task(task_id):
    data = request.get_json()

    title = data.get("title", "").strip()
    priority = data.get("priority", "Low")
    due_date = data.get("due_date", "")

    if not title:
        return jsonify({"error": "Task name is required"}), 400

    if priority not in ["Low", "Medium", "High"]:
        return jsonify({"error": "Invalid priority"}), 400

    connection = get_db_connection()

    result = connection.execute(
        """UPDATE tasks
           SET title = ?, priority = ?, due_date = ?
           WHERE id = ?""",
        (title, priority, due_date, task_id)
    )

    connection.commit()
    connection.close()

    if result.rowcount == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task updated successfully"})


# Delete a task
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    connection = get_db_connection()

    result = connection.execute(
        "DELETE FROM tasks WHERE id = ?",
        (task_id,)
    )

    connection.commit()
    connection.close()

    if result.rowcount == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted successfully"})


# Mark task as completed or pending
@app.route("/api/tasks/<int:task_id>/complete", methods=["PATCH"])
def complete_task(task_id):
    connection = get_db_connection()

    result = connection.execute(
        """UPDATE tasks
           SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END
           WHERE id = ?""",
        (task_id,)
    )

    connection.commit()
    connection.close()

    if result.rowcount == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task status updated"})


if __name__ == "__main__":
    create_table()
    app.run(debug=True)
