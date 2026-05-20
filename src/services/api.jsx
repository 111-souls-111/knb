import axios from 'axios';
import { io } from 'socket.io-client';

// URL сервера авторизации (уже есть)
const BASE_URL = 'https://knb-master-maxim12341234.amvera.io/';
// const BASE_URL = 'http://127.0.0.1:5000'

// URL сервера онлайн игры (замените после деплоя)
const ONLINE_URL ='https://knb-socket-maxim12341234.amvera.io/'  
    // : 'http://127.0.0.1:5001';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Функция для создания WebSocket соединения
const createSocket = () => {
    const socket = io(ONLINE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true
    });
    return socket;
};

// Логирование
api.interceptors.request.use(
    (config) => {
        console.log(`📤 ${config.method.toUpperCase()} ${config.url}`, config.data);
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        console.log(`📥 ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        console.error('❌ Ошибка:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;
export { createSocket, ONLINE_URL };

// const BASE_URL = 'http://127.0.0.1:5000'