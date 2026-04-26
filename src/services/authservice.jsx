import api from './api';

export const authService = {
    // Регистрация
    register: async (username, password) => {
        try {
            const response = await api.post('/register', {
                username: username,
                password: password
            });

            return {
                success: true,
                message: response.data.message || 'Регистрация успешна!'
            };
        } catch (error) {
            console.error('Ошибка регистрации:', error);

            let errorMessage = 'Ошибка регистрации';

            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Сервер не запущен. Запустите Flask сервер на localhost:5000';
            } else if (error.response && error.response.status === 400) {
                const errors = error.response.data && error.response.data.errors;
                if (errors && Array.isArray(errors)) {
                    errorMessage = errors.join(', ');
                } else {
                    errorMessage = (error.response.data && error.response.data.error) || 'Неверные данные';
                }
            } else if (error.response && error.response.status === 409) {
                errorMessage = (error.response.data && error.response.data.error) || 'Пользователь уже существует';
            } else if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Вход (без токена)
    login: async (username, password) => {
        try {
            const response = await api.post('/login', {
                username: username,
                password: password
            });

            // Сохраняем информацию о пользователе (токена нет)
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('username', username);

            return {
                success: true,
                message: response.data.message,
                user: { username: username }
            };
        } catch (error) {
            console.error('Ошибка входа:', error);

            let errorMessage = 'Ошибка входа';

            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Сервер не запущен. Запустите Flask сервер на localhost:5000';
            } else if (error.response && error.response.status === 401) {
                errorMessage = (error.response.data && error.response.data.error) || 'Неверное имя пользователя или пароль';
            } else if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Проверка авторизации
    isAuthenticated: function() {
        return localStorage.getItem('isAuthenticated') === 'true';
    },

    // Получить имя пользователя
    getUsername: function() {
        return localStorage.getItem('username');
    },

    // Выход
    logout: function() {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        console.log('Выход выполнен');
    }
};