import axios from 'axios';

// URL вашего Flask сервера
const BASE_URL = 'https://knb-master.amvera.io';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Добавляем логирование
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
        console.error('❌ Ошибка:', error.response ?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;