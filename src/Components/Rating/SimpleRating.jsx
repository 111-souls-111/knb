import React, { useState, useEffect } from 'react';
import { ratingService } from '../../services/ratingservice';
import styles from './SimpleRating.module.css';

const SimpleRating = ({ username }) => {
    const [wins, setWins] = useState(0);

    const loadStats = async () => {
        if (!username) return;
        const result = await ratingService.getUserRating(username);
        if (result.success) {
            setWins(result.wins);
        }
    };

    useEffect(() => {
        loadStats();
    }, [username]);

    // Слушаем событие обновления рейтинга
    useEffect(() => {
        window.addEventListener('rating-updated', loadStats);
        return () => window.removeEventListener('rating-updated', loadStats);
    }, [username]);

    return (
        <div className={styles.simpleRating}>
            🏆 {wins}
        </div>
    );
};

export default SimpleRating;