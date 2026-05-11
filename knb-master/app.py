from flask import Flask, request, jsonify
from flask_cors import CORS 
import sqlite3
import os
import hashlib

app = Flask(__name__)

CORS(app) 

CORS(app, origins=[
    "https://knb-mmelnikov750-qyxa.onreza.app",
    "https://knb-master.amvera.io"
])

# База данных
DATABASE = "users.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Таблица пользователей
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # Таблица рейтинга - только wins
    c.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            wins INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()
    print("База данных готова")

def get_db():
    return sqlite3.connect(DATABASE)

@app.route("/")
def hello():
    return "Сервер работает!"

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        conn = get_db()
        c = conn.cursor()
        
        try:
            c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                     (username, password_hash))
            c.execute('INSERT INTO ratings (username, wins) VALUES (?, ?)', 
                     (username, 0))
            conn.commit()
            return jsonify({"message": "OK"}), 201
        except sqlite3.IntegrityError:
            return jsonify({"error": "Пользователь существует"}), 409
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE username = ? AND password_hash = ?', 
                 (username, password_hash))
        user = c.fetchone()
        conn.close()
        
        if user:
            return jsonify({"message": f"Welcome {username}"}), 200
        else:
            return jsonify({"error": "Неверные данные"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ПРОСТОЙ РЕЙТИНГ - ТОЛЬКО ПОБЕДЫ
@app.route("/rating/<username>", methods=["GET"])
def get_rating(username):
    try:
        print(f"GET /rating/{username}")
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT wins FROM ratings WHERE username = ?', (username,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return jsonify({"wins": result[0]}), 200
        else:
            return jsonify({"wins": 0}), 200
    except Exception as e:
        print(f"Ошибка: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/rating/update", methods=["POST"])
def update_rating():
    try:
        data = request.get_json()
        username = data.get("username")
        print(f"POST /rating/update {username}")
        
        conn = get_db()
        c = conn.cursor()
        
        # Проверяем есть ли запись
        c.execute('SELECT wins FROM ratings WHERE username = ?', (username,))
        result = c.fetchone()
        
        if result:
            new_wins = result[0] + 1
            c.execute('UPDATE ratings SET wins = ? WHERE username = ?', (new_wins, username))
        else:
            new_wins = 1
            c.execute('INSERT INTO ratings (username, wins) VALUES (?, ?)', (username, new_wins))
        
        conn.commit()
        conn.close()
        
        print(f"Новое количество побед: {new_wins}")
        return jsonify({"wins": new_wins}), 200
    except Exception as e:
        print(f"Ошибка: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)