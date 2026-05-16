import React, { useState, useEffect } from 'react';
import { ratingService } from '../../services/ratingservice';
import styles from './SimpleRating.module.css';

const SimpleRating = ({ username }) => {
    const [wins, setWins] = useState(0);

    const loadStats = async () => {
        if (!username) return;
        
        console.log('📊 Загрузка рейтинга для:', username);
        const result = await ratingService.getUserRating(username);
        console.log('📊 Побед:', result.wins);
        
        if (result.success) {
            setWins(result.wins);
        }
    };

    useEffect(() => {
        loadStats();
    }, [username]);

    // Слушаем событие обновления рейтинга
    useEffect(() => {
        const handleRatingUpdate = (event) => {
            console.log('🔄 Получено событие обновления рейтинга:', event.detail);
            loadStats(); // Просто перезагружаем статистику
        };
        
        window.addEventListener('rating-updated', handleRatingUpdate);
        return () => window.removeEventListener('rating-updated', handleRatingUpdate);
    }, [username]);

    return (
        <div className={styles.simpleRating}>
            🏆 {wins}
        </div>
    );
};

export default SimpleRating;