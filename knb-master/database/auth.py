import sqlite3
import os

# Определяем путь к базе данных в зависимости от окружения
DATABASE = "/data/users.db" if "AMVERA" in os.environ else "users.db"

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
    
    # Таблица рейтинга
    c.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            rating INTEGER DEFAULT 1200,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"База данных инициализирована: {DATABASE}")

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def add_user(username, password_hash):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, password_hash)
        )
        # Создаем запись рейтинга для нового пользователя
        c.execute('''
            INSERT OR IGNORE INTO ratings (username, rating, wins, losses, draws, games_played)
            VALUES (?, 1200, 0, 0, 0, 0)
        ''', (username,))
        conn.commit()
        return True, None
    except sqlite3.IntegrityError:
        return False, "Пользователь уже существует"
    finally:
        conn.close()

def get_user(username):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = c.fetchone()
    conn.close()
    return user

# Функции для рейтинга
def get_user_rating(username):
    """Получение полной статистики пользователя"""
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('''
            SELECT rating, wins, losses, draws, games_played 
            FROM ratings 
            WHERE username = ?
        ''', (username,))
        result = c.fetchone()
        conn.close()
        
        if not result:
            return {
                'rating': 1200,
                'wins': 0,
                'losses': 0,
                'draws': 0,
                'games_played': 0
            }
        
        return {
            'rating': result[0],
            'wins': result[1],
            'losses': result[2],
            'draws': result[3],
            'games_played': result[4]
        }
    except Exception as e:
        print(f"Ошибка get_user_rating: {e}")
        conn.close()
        return {
            'rating': 1200,
            'wins': 0,
            'losses': 0,
            'draws': 0,
            'games_played': 0
        }

def update_user_rating(username, result_type='win', opponent_rating=1200):
    """
    Обновление рейтинга пользователя
    result_type: 'win', 'lose', 'draw'
    """
    conn = get_db()
    c = conn.cursor()
    try:
        # Получаем текущие данные
        c.execute('''
            SELECT rating, wins, losses, draws, games_played 
            FROM ratings 
            WHERE username = ?
        ''', (username,))
        result = c.fetchone()
        
        if not result:
            # Создаем запись если нет
            current_rating = 1200
            wins = 0
            losses = 0
            draws = 0
            games_played = 0
        else:
            current_rating = result[0]
            wins = result[1]
            losses = result[2]
            draws = result[3]
            games_played = result[4]
        
        # Расчет изменения рейтинга (Elo система)
        expected_score = 1 / (1 + 10 ** ((opponent_rating - current_rating) / 400))
        K_FACTOR = 32
        
        if result_type == 'win':
            actual_score = 1
            wins += 1
        elif result_type == 'lose':
            actual_score = 0
            losses += 1
        else:  # draw
            actual_score = 0.5
            draws += 1
        
        rating_change = round(K_FACTOR * (actual_score - expected_score))
        new_rating = max(1, current_rating + rating_change)
        games_played += 1
        
        # Обновляем базу данных
        c.execute('''
            UPDATE ratings 
            SET rating = ?, 
                wins = ?, 
                losses = ?, 
                draws = ?, 
                games_played = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        ''', (new_rating, wins, losses, draws, games_played, username))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'new_rating': new_rating,
            'rating_change': rating_change,
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'games_played': games_played
        }
    except Exception as e:
        print(f"Ошибка update_user_rating: {e}")
        conn.close()
        return {
            'success': False,
            'error': str(e)
        }

def get_leaderboard(limit=10):
    """Получение таблицы лидеров"""
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('''
            SELECT username, rating, wins, losses, draws, games_played
            FROM ratings 
            ORDER BY rating DESC 
            LIMIT ?
        ''', (limit,))
        leaders = [dict(row) for row in c.fetchall()]
        conn.close()
        return leaders
    except Exception as e:
        print(f"Ошибка get_leaderboard: {e}")
        return []