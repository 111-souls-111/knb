from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import sqlite3
import hashlib
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# База данных
DATABASE = "users.db"

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
    print("База данных готова")

def get_db():
    return sqlite3.connect(DATABASE)

# Хранилище игр
games = {}  # room_id: {players: [], gestures: {}, scores: {}, status: 'waiting/playing'}

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

# ========== WebSocket для онлайн игры ==========

@socketio.on('find_game')
def find_game(data):
    username = data.get('username')
    print(f"🔍 {username} ищет игру")
    
    # Ищем ожидающую игру
    waiting_room = None
    for room_id, game in games.items():
        if game['status'] == 'waiting' and len(game['players']) == 1:
            waiting_room = room_id
            break
    
    if waiting_room:
        # Присоединяемся к существующей игре
        join_room(waiting_room)
        games[waiting_room]['players'].append(username)
        games[waiting_room]['status'] = 'playing'
        games[waiting_room]['scores'] = {username: 0, games[waiting_room]['players'][0]: 0}
        games[waiting_room]['gestures'] = {}
        
        print(f"✅ Игра создана! Комната: {waiting_room}")
        print(f"👥 Игроки: {games[waiting_room]['players']}")
        
        # Отправляем обоим игрокам что игра началась
        emit('game_start', {
            'players': games[waiting_room]['players'],
            'room': waiting_room
        }, room=waiting_room)
    else:
        # Создаем новую игру
        room_id = str(uuid.uuid4())[:8]
        join_room(room_id)
        games[room_id] = {
            'players': [username],
            'status': 'waiting',
            'scores': {},
            'gestures': {}
        }
        print(f"🆕 Создана новая комната: {room_id}, ожидание игрока...")
        emit('waiting_for_player', {'room': room_id})

@socketio.on('make_gesture')
def make_gesture(data):
    room = data.get('room')
    username = data.get('username')
    gesture = data.get('gesture')
    
    if room not in games:
        return
    
    games[room]['gestures'][username] = gesture
    print(f"✋ {username} показал {gesture} в комнате {room}")
    
    # Если оба игрока сделали жест
    if len(games[room]['gestures']) == 2:
        players = games[room]['players']
        p1, p2 = players[0], players[1]
        g1, g2 = games[room]['gestures'][p1], games[room]['gestures'][p2]
        
        # Определяем победителя
        winner = None
        if g1 == g2:
            result = 'draw'
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
        
        # Проверяем победу в игре (до 3 побед)
        game_winner = None
        if games[room]['scores'][p1] >= 3:
            game_winner = p1
        elif games[room]['scores'][p2] >= 3:
            game_winner = p2
        
        # Отправляем результат
        emit('round_result', {
            'p1': p1,
            'p2': p2,
            'g1': g1,
            'g2': g2,
            'result': result,
            'winner': winner,
            'scores': games[room]['scores'],
            'game_winner': game_winner
        }, room=room)
        
        # Очищаем жесты для следующего раунда
        games[room]['gestures'] = {}
        
        # Если игра окончена
        if game_winner:
            # Обновляем рейтинг победителя
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT wins FROM ratings WHERE username = ?', (game_winner,))
            result = c.fetchone()
            if result:
                c.execute('UPDATE ratings SET wins = ? WHERE username = ?', (result[0] + 1, game_winner))
            else:
                c.execute('INSERT INTO ratings (username, wins) VALUES (?, ?)', (game_winner, 1))
            conn.commit()
            conn.close()
            
            # Удаляем игру
            del games[room]

@socketio.on('disconnect')
def handle_disconnect():
    print(f"❌ Клиент отключился")

if __name__ == "__main__":
    init_db()
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)