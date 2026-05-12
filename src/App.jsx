import React, { useState, useEffect } from 'react';
import { CameraView } from './Components/Camera';
import styles from './App.module.css';
import { GameProvider } from '../src/Context/gamecontext';
import Login from './Components/auth/Login';
import Register from './Components/auth/Register';
import { authService } from './services/authservice';
import SimpleRating from './Components/Rating/SimpleRating';
import OnlineGame from './Components/Online/OnlineGame'; // ДОБАВИТЬ импорт

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [gameMode, setGameMode] = useState('single');
    const [showRegister, setShowRegister] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const isAuth = authService.isAuthenticated();
        const user = authService.getUsername();
        setIsAuthenticated(isAuth);
        setUsername(user || '');
        setIsChecking(false);
    }, []);

    const handleLoginSuccess = (user) => {
        setUsername(user.username);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        authService.logout();
        setUsername('');
        setIsAuthenticated(false);
    };

    if (isChecking) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loader}></div>
                <p>Проверка авторизации...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return showRegister ? (
            <Register 
                onRegisterSuccess={() => setShowRegister(false)}
                onSwitchToLogin={() => setShowRegister(false)}
            />
        ) : (
            <Login 
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setShowRegister(true)}
            />
        );
    }

    return (
        <GameProvider>
            <div className={styles.app}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>
                            ✊ Камень-Ножницы-Бумага ✌️
                        </h1>

                        <div className={styles.userInfo}>
                            <SimpleRating username={username} />
                            <span>👤 {username}</span>
                            <button onClick={handleLogout} className={styles.logoutBtn}>
                                Выйти
                            </button>
                        </div>
                    </div>
                    
                    {/* ДОБАВИТЬ КНОПКИ ПЕРЕКЛЮЧЕНИЯ РЕЖИМОВ */}
                    <div className={styles.gameModeSwitch}>
                        <button 
                            className={`${styles.modeBtn} ${gameMode === 'single' ? styles.activeMode : ''}`}
                            onClick={() => setGameMode('single')}
                        >
                            🎮 Одиночная игра
                        </button>
                        <button 
                            className={`${styles.modeBtn} ${gameMode === 'online' ? styles.activeMode : ''}`}
                            onClick={() => setGameMode('online')}
                        >
                            🌐 Онлайн режим
                        </button>
                    </div>
                    
                    <p className={styles.subtitle}>
                        {gameMode === 'single' 
                            ? 'Покажите жест в камеру и победите!'
                            : 'Сразитесь с реальным соперником!'}
                    </p>
                </header>
                
                <main className={styles.main}>
                    {gameMode === 'single' ? (
                        <CameraView />
                    ) : (
                        <OnlineGame />
                    )}
                </main>
                
                <footer className={styles.footer}>
                    <p>🎮 Жесты: 👊 Камень | ✌️ Ножницы | ✋ Бумага</p>
                </footer>
            </div>
        </GameProvider>
    );
}

export default App;