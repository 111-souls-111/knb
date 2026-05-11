import api from './api';

export const ratingService = {
    getUserRating: async (username) => {
        try {
            const response = await api.get(`/rating/${username}`);
            return {
                success: true,
                wins: response.data.wins || 0
            };
        } catch (error) {
            console.error('Ошибка:', error);
            return {
                success: false,
                wins: 0
            };
        }
    },

    updateRating: async (username) => {
        try {
            const response = await api.post('/rating/update', { username });
            return {
                success: true,
                wins: response.data.wins
            };
        } catch (error) {
            console.error('Ошибка:', error);
            return {
                success: false
            };
        }
    }
};