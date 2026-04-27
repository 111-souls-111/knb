import React, { useState, useEffect } from 'react';
import { CameraView } from './Components/Camera';
import styles from './App.module.css';
import { GameProvider } from '../src/Context/gamecontext';
import Login from './Components/auth/Login';
import Register from './Components/auth/Register';
import { authService } from './services/authservice';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const isAuth = authService.isAuthenticated();
        const user = authService.getUsername();
        
        setIsAuthenticated(isAuth);
        setUsername(user);
        setIsChecking(false);
    }, []);

    const handleLoginSuccess = (user) => {
        setUsername(user.username);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        authService.logout();
        setUsername(null);
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
                            <span>👤 {username}</span>
                            <button onClick={handleLogout} className={styles.logoutBtn}>
                                Выйти
                            </button>
                        </div>
                    </div>
                    <p className={styles.subtitle}>
                        Покажите жест в камеру и победите компьютер!
                    </p>
                </header>
                
                <main className={styles.main}>
                    <CameraView />
                </main>
                
                <footer className={styles.footer}>
                    <p>🎮 Жесты: 👊 Камень | ✌️ Ножницы | ✋ Бумага</p>
                </footer>
            </div>
        </GameProvider>
    );
}

export default App;