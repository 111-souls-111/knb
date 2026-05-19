from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import sqlite3
import hashlib
import uuid
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret!')

CORS(app, origins=[
    "https://knb-mmelnikov750-qyxa.onreza.app",
    "https://*.onreza.app",
    "http://localhost:3000"
])

socketio = SocketIO(app, cors_allowed_origins="*")

# База данных - используем /data для постоянного хранения
DATABASE = "/data/users.db" if "AMVERA" in os.environ else "users.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            wins INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()
    print(f"База данных готова: {DATABASE}")

def get_db():
    return sqlite3.connect(DATABASE)

# Хранилище игр (в памяти)
games = {}

@app.route("/")
def hello():
    return "Сервер онлайн игры работает!"

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

@app.route("/rating/<username>", methods=["GET"])
def get_rating(username):
    try:
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
        return jsonify({"error": str(e)}), 500

@app.route("/rating/update", methods=["POST"])
def update_rating():
    try:
        data = request.get_json()
        username = data.get("username")
        
        conn = get_db()
        c = conn.cursor()
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
        
        return jsonify({"wins": new_wins}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========== WebSocket для онлайн игры ==========

@socketio.on('connect')
def handle_connect():
    print("✅ Клиент подключился")

@socketio.on('disconnect')
def handle_disconnect():
    print("❌ Клиент отключился")

@socketio.on('find_game')
def find_game(data):
    username = data.get('username')
    print(f"🔍 {username} ищет игру")
    
    waiting_room = None
    for room_id, game in games.items():
        if game.get('status') == 'waiting' and len(game.get('players', [])) == 1:
            waiting_room = room_id
            break
    
    if waiting_room:
        join_room(waiting_room)
        games[waiting_room]['players'].append(username)
        games[waiting_room]['status'] = 'playing'
        games[waiting_room]['scores'] = {username: 0, games[waiting_room]['players'][0]: 0}
        games[waiting_room]['gestures'] = {}
        
        print(f"✅ Игра создана! Комната: {waiting_room}")
        
        emit('game_start', {
            'players': games[waiting_room]['players'],
            'room': waiting_room
        }, room=waiting_room)
    else:
        room_id = str(uuid.uuid4())[:8]
        join_room(room_id)
        games[room_id] = {
            'players': [username],
            'status': 'waiting',
            'scores': {},
            'gestures': {}
        }
        print(f"🆕 Создана новая комната: {room_id}")
        emit('waiting_for_player', {'room': room_id})

@socketio.on('make_gesture')
def make_gesture(data):
    room = data.get('room')
    username = data.get('username')
    gesture = data.get('gesture')
    
    if room not in games:
        return
    
    games[room]['gestures'][username] = gesture
    print(f"✋ {username} показал {gesture}")
    
    if len(games[room]['gestures']) == 2:
        players = games[room]['players']
        p1, p2 = players[0], players[1]
        g1, g2 = games[room]['gestures'][p1], games[room]['gestures'][p2]
        
        if g1 == g2:
            result = 'draw'
            winner = None
        elif (g1 == 'rock' and g2 == 'scissors') or \
             (g1 == 'scissors' and g2 == 'paper') or \
             (g1 == 'paper' and g2 == 'rock'):
            result = 'win'
            winner = p1
            games[room]['scores'][p1] += 1
        else:
            result = 'lose'
            winner = p2
            games[room]['scores'][p2] += 1
        
        game_winner = None
        if games[room]['scores'][p1] >= 3:
            game_winner = p1
            update_winner_rating(p1)
        elif games[room]['scores'][p2] >= 3:
            game_winner = p2
            update_winner_rating(p2)
        
        emit('round_result', {
            'p1': p1, 'p2': p2,
            'g1': g1, 'g2': g2,
            'result': result,
            'winner': winner,
            'scores': games[room]['scores'],
            'game_winner': game_winner
        }, room=room)
        
        games[room]['gestures'] = {}
        
        if game_winner:
            del games[room]

def update_winner_rating(username):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT wins FROM ratings WHERE username = ?', (username,))
    result = c.fetchone()
    if result:
        c.execute('UPDATE ratings SET wins = ? WHERE username = ?', (result[0] + 1, username))
    else:
        c.execute('INSERT INTO ratings (username, wins) VALUES (?, ?)', (username, 1))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get('PORT', 8080))
    socketio.run(app, host='0.0.0.0', port=port)