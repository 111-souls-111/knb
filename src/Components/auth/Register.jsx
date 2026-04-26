import React, { useState } from 'react';
import { authService } from '../../services/authservice';
import styles from './Auth.module.css';

const Register = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
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
        
        // Валидация
        if (!formData.username || !formData.password) {
            setError('Заполните все поля');
            return;
        }
        
        if (formData.username.length < 3) {
            setError('Имя пользователя должно быть не менее 3 символов');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        
        setIsLoading(true);
        
        const result = await authService.register(
            formData.username,
            formData.password
        );
        
        setIsLoading(false);
        
        if (result.success) {
            alert('Регистрация успешна! Теперь войдите в систему.');
            onRegisterSuccess();
        } else {
            setError(result.error);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h2>📝 Регистрация</h2>
                
                {error && <div className={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>👤 Имя пользователя</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Минимум 3 символа"
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
                            placeholder="Минимум 6 символов"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label>🔒 Подтверждение пароля</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Повторите пароль"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={styles.submitBtn}
                    >
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                
                <p className={styles.switchText}>
                    Уже есть аккаунт?{' '}
                    <button onClick={onSwitchToLogin} className={styles.switchBtn}>
                        Войти
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;