from flask import Flask, request, jsonify
from flask_cors import CORS 
from database.auth import init_db, add_user, get_user
from pasword.secur import hash_password, verify_password, validate_credentials

app = Flask(__name__)
CORS(app) 


@app.route("/")
def hello():
    return "Сервер регистрации работает!"


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Неверный JSON"}), 400

    username = data.get("username")
    password = data.get("password")

    # Валидация
    errors = validate_credentials(username, password)
    if errors:
        return jsonify({"errors": errors}), 400

    # Хеширование и сохранение
    password_hash = hash_password(password)
    success, error = add_user(username, password_hash)

    if not success:
        return jsonify({"error": error}), 409

    return jsonify({"message": f"Пользователь {username} зарегистрирован!"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = get_user(username)
    if not user:
        return jsonify({"error": "Неверные учетные данные"}), 401

    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Неверные учетные данные"}), 401

    return jsonify({"message": f"Добро пожаловать, {username}!"}), 200


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
