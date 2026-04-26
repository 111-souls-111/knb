import React, { useState } from 'react';
import { authService } from '../../services/authservice';
import styles from './Auth.module.css';

const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            setError('Заполните все поля');
            return;
        }
        
        setIsLoading(true);
        
        const result = await authService.login(
            formData.username,
            formData.password
        );
        
        setIsLoading(false);
        
        if (result.success) {
            onLoginSuccess(result.user);
        } else {
            setError(result.error);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h2>🎮 Вход в игру</h2>
                
                {error && <div className={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>👤 Имя пользователя</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Введите имя пользователя"
                            disabled={isLoading}
                            autoComplete="off"
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label>🔒 Пароль</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Введите пароль"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={styles.submitBtn}
                    >
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
                
                <p className={styles.switchText}>
                    Нет аккаунта?{' '}
                    <button onClick={onSwitchToRegister} className={styles.switchBtn}>
                        Зарегистрироваться
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;