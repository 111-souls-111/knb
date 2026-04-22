import React, { useState, useEffect } from 'react';
import { useGame } from '../../Context/gamecontext';
import { useHandGesture } from '../../Hooks/UseHandGesture';
import { ALL_GESTURES, GESTURE_DISPLAY, GAME_SETTINGS, ROUND_RESULTS } from '../../utils/gameconstant'
import styles from './GameArea.module.css';

const GameArea = ({ isCameraReady, webcamRef }) => {
    const {
        playerScore,
        computerScore,
        playerGesture,
        computerGesture,
        roundResult,
        gameStatus,
        winner,
        countdown,
        startGame,
        startCountdown,
        updateCountdown,
        setGestures,
        finishRound,
        nextRound,
        resetGame
    } = useGame();
    
    const { analyzeGesture } = useHandGesture();
    const [detectedGesture, setDetectedGesture] = useState(null);

    // 1. Распознавание жеста во время отсчета
    useEffect(() => {
        if (!isCameraReady || !webcamRef?.current || gameStatus !== 'countdown') return;
        
        const interval = setInterval(async () => {
            const video = webcamRef.current.video;
            if (video && video.readyState === 4) {
                const gesture = await analyzeGesture(video);
                if (gesture !== 'none') {
                    setDetectedGesture(gesture);
                }
            }
        }, 100);
        
        return () => clearInterval(interval);
    }, [isCameraReady, webcamRef, gameStatus, analyzeGesture]);

    // 2. Управление таймером
    useEffect(() => {
        if (gameStatus !== 'countdown') return;
        
        // Запуск таймера
        if (countdown === null) {
            startCountdown();
            return;
        }
        
        // Таймер дошел до 0 - завершаем раунд
        if (countdown === 0) {
            const playerChoice = detectedGesture || ALL_GESTURES[0];
            const computerChoice = ALL_GESTURES[Math.floor(Math.random() * 3)];
            
            setGestures(playerChoice, computerChoice);
            finishRound(playerChoice, computerChoice);
            return;
        }
        
        // Уменьшаем таймер каждую секунду
        const timer = setTimeout(() => {
            updateCountdown(countdown - 1);
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [gameStatus, countdown, detectedGesture, startCountdown, updateCountdown, setGestures, finishRound]);

    // 3. Переход к следующему раунду
    useEffect(() => {
        if (gameStatus === 'roundEnd' && !winner) {
            const timer = setTimeout(() => {
                nextRound();
                setDetectedGesture(null);
            }, GAME_SETTINGS.ROUND_DELAY);
            
            return () => clearTimeout(timer);
        }
    }, [gameStatus, winner, nextRound]);

    // Получение текста результата
    const getResultText = () => {
        if (roundResult === ROUND_RESULTS.WIN) return '🎉 Победа! 🎉';
        if (roundResult === ROUND_RESULTS.LOSE) return '💻 Поражение! 💻';
        if (roundResult === ROUND_RESULTS.DRAW) return '🤝 Ничья! 🤝';
        return '';
    };

    // Экран ожидания
    if (gameStatus === 'waiting') {
        return (
            <div className={styles.waitingScreen}>
                <h2>🎮 Камень-Ножницы-Бумага</h2>
                <p>Покажите жест рукой в камеру!</p>
                <button onClick={startGame} className={styles.startBtn}>
                    Начать игру
                </button>
            </div>
        );
    }

    // Экран окончания игры
    if (gameStatus === 'gameOver' && winner) {
        return (
            <div className={styles.gameOverScreen}>
                <h2>{winner === 'player' ? '🏆 ПОБЕДА! 🏆' : '💻 ПОРАЖЕНИЕ! 💻'}</h2>
                <div className={styles.finalScore}>Счет: {playerScore} : {computerScore}</div>
                <button onClick={resetGame} className={styles.playAgainBtn}>
                    Играть снова
                </button>
            </div>
        );
    }

    // Основной экран игры
    return (
        <div className={styles.gameArea}>
            {/* Счет */}
            <div className={styles.scoreBoard}>
                <div className={styles.scoreCard}>
                    <div className={styles.scoreLabel}>👤 ИГРОК</div>
                    <div className={styles.scoreValue}>{playerScore}</div>
                </div>
                <div className={styles.scoreDivider}>:</div>
                <div className={styles.scoreCard}>
                    <div className={styles.scoreLabel}>💻 КОМПЬЮТЕР</div>
                    <div className={styles.scoreValue}>{computerScore}</div>
                </div>
            </div>

            {/* Жесты */}
            <div className={styles.gesturesContainer}>
                <div className={styles.gestureBox}>
                    <div className={styles.gestureLabel}>Ваш жест</div>
                    <div className={styles.gestureEmoji}>
                        {playerGesture ? GESTURE_DISPLAY[playerGesture]?.emoji : '❓'}
                    </div>
                    <div className={styles.gestureName}>
                        {playerGesture ? GESTURE_DISPLAY[playerGesture]?.name : '...'}
                    </div>
                </div>
                
                <div className={styles.vsText}>VS</div>
                
                <div className={styles.gestureBox}>
                    <div className={styles.gestureLabel}>Жест компьютера</div>
                    <div className={styles.gestureEmoji}>
                        {computerGesture ? GESTURE_DISPLAY[computerGesture]?.emoji : '❓'}
                    </div>
                    <div className={styles.gestureName}>
                        {computerGesture ? GESTURE_DISPLAY[computerGesture]?.name : '...'}
                    </div>
                </div>
            </div>

            {/* Таймер */}
            {gameStatus === 'countdown' && countdown > 0 && (
                <div className={styles.countdown}>
                    <div className={styles.countdownNumber}>{countdown}</div>
                    <div className={styles.countdownText}>Покажите жест!</div>
                </div>
            )}

            {/* Результат раунда */}
            {gameStatus === 'roundEnd' && roundResult && (
                <div className={`${styles.roundResult} ${styles[roundResult]}`}>
                    {getResultText()}
                </div>
            )}
        </div>
    );
};

export default GameArea;