import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Webcam from 'react-webcam';
import { useHandGesture } from '../../Hooks/UseHandGesture';
import { authService } from '../../services/authservice';
import styles from './OnlineGame.module.css';

const OnlineGame = () => {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState('searching');
    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState({});
    const [roundResult, setRoundResult] = useState(null);
    const [lastGestures, setLastGestures] = useState({});
    const webcamRef = useRef(null);
    const { analyzeGesture, isModelLoading } = useHandGesture();
    const [detectedGesture, setDetectedGesture] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [manualGesture, setManualGesture] = useState(null); // Для кнопок

    useEffect(() => {
        const username = authService.getUsername();
        if (!username) return;

        const newSocket = io('http://127.0.0.1:5001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Соединение установлено');
            newSocket.emit('find_game', { username });
        });

        newSocket.on('waiting_for_player', (data) => {
            setGameState('waiting');
            setRoom(data.room);
        });

        newSocket.on('game_start', (data) => {
            setGameState('playing');
            setPlayers(data.players);
            setRoom(data.room);
            setScores({});
            setManualGesture(null);
            setDetectedGesture(null);
            startCountdown();
        });

        newSocket.on('round_result', (data) => {
            setScores(data.scores);
            setLastGestures({
                [data.p1]: data.g1,
                [data.p2]: data.g2
            });
            setRoundResult({
                winner: data.winner,
                result: data.result
            });

            const currentUsername = authService.getUsername();

            if (data.game_winner) {
                if (data.game_winner === currentUsername) {
                    console.log('🏆 ПОБЕДА! Обновляем рейтинг...');
                    window.dispatchEvent(new CustomEvent('rating-updated'));
                }
                setGameState('gameOver');
                setTimeout(() => {
                    setGameState('searching');
                    newSocket.emit('find_game', { username: currentUsername });
                }, 3000);
            } else {
                setTimeout(() => {
                    setRoundResult(null);
                    setLastGestures({});
                    setDetectedGesture(null);
                    setManualGesture(null);
                    startCountdown();
                }, 2000);
            }
        });
        newSocket.on('player_disconnected', (data) => {
    console.log('Соперник покинул игру:', data.message);
    alert('Соперник покинул игру! Возвращаемся в лобби...');
    
    // Возвращаемся в состояние поиска
    setGameState('searching');
    setPlayers([]);
    setScores({});
    setRoundResult(null);
    setLastGestures({});
    setDetectedGesture(null);
    setManualGesture(null);
    
    // Заново ищем игру
    setTimeout(() => {
        newSocket.emit('find_game', { username: authService.getUsername() });
    }, 2000);
});

        return () => newSocket.close();
    }, []);

    const startCountdown = () => {
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Отправка жеста (общая функция)
    const sendGesture = (gesture) => {
        if (gameState !== 'playing' || countdown !== null) return;
        if (socket && room) {
            console.log('📤 Отправка жеста:', gesture);
            socket.emit('make_gesture', {
                room: room,
                username: authService.getUsername(),
                gesture: gesture
            });
        }
    };

    // Ручной выбор жеста (кнопки)
    const handleManualGesture = (gesture) => {
        if (gameState !== 'playing' || countdown !== null) return;
        if (manualGesture) return; // Уже отправили
        if (detectedGesture) return; // Уже отправили через камеру
        
        console.log('🖱️ Ручной выбор жеста:', gesture);
        setManualGesture(gesture);
        sendGesture(gesture);
    };

    // Распознавание жеста через камеру
    useEffect(() => {
        if (gameState !== 'playing' || countdown !== null) return;
        if (manualGesture) return; // Если уже выбрали кнопкой, не используем камеру
        
        const interval = setInterval(async () => {
            const video = webcamRef.current?.video;
            if (video && video.readyState === 4 && socket && room) {
                const gesture = await analyzeGesture(video);
                if (gesture !== 'none' && gesture !== detectedGesture && !manualGesture) {
                    console.log('🎥 Камера распознала:', gesture);
                    setDetectedGesture(gesture);
                    sendGesture(gesture);
                }
            }
        }, 500);
        
        return () => clearInterval(interval);
    }, [gameState, countdown, socket, room, analyzeGesture, detectedGesture, manualGesture]);

    const getGestureEmoji = (gesture) => {
        const emojis = {
            rock: '👊',
            paper: '✋',
            scissors: '✌️'
        };
        return emojis[gesture] || '❓';
    };

    const getGestureName = (gesture) => {
        const names = {
            rock: 'Камень',
            paper: 'Бумага',
            scissors: 'Ножницы'
        };
        return names[gesture] || '';
    };

    const username = authService.getUsername();
    const opponent = players.find(p => p !== username);
    const selectedGesture = manualGesture || detectedGesture;

    if (gameState === 'searching' || gameState === 'waiting') {
        return (
            <div className={styles.onlineContainer}>
                <div className={styles.searchingCard}>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        className={styles.hiddenWebcam}
                        style={{ display: 'none' }}
                    />
                    <div className={styles.loader}></div>
                    <h2>{gameState === 'searching' ? 'Поиск соперника...' : 'Ожидание соперника...'}</h2>
                    <p>🎮 Подготовьте камеру!</p>
                    <p>💡 Можно также использовать кнопки во время игры</p>
                    {isModelLoading && <p>🔄 Загрузка модели распознавания...</p>}
                </div>
            </div>
        );
    }

    if (gameState === 'gameOver') {
        const isWinner = scores[username] >= 3;
        return (
            <div className={styles.onlineContainer}>
                <div className={styles.gameOverCard}>
                    <h1>{isWinner ? '🏆 ПОБЕДА! 🏆' : '💔 ПОРАЖЕНИЕ! 💔'}</h1>
                    <div className={styles.finalScore}>
                        {players[0]}: {scores[players[0]]} - {players[1]}: {scores[players[1]]}
                    </div>
                    <p>Переход в лобби...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.onlineContainer}>
            <Webcam
                ref={webcamRef}
                audio={false}
                className={styles.webcam}
                mirrored={true}
            />
            
            <div className={styles.gameHeader}>
                <div className={styles.playerCard}>
                    <div className={styles.playerName}>👤 {username}</div>
                    <div className={styles.playerScore}>{scores[username] || 0}</div>
                    <div className={styles.gesture}>
                        {selectedGesture && (
                            <>
                                {getGestureEmoji(selectedGesture)}
                                <span className={styles.gestureName}>{getGestureName(selectedGesture)}</span>
                            </>
                        )}
                        {!selectedGesture && '❓'}
                    </div>
                </div>
                <div className={styles.vs}>VS</div>
                <div className={styles.playerCard}>
                    <div className={styles.playerName}>👾 {opponent || 'Соперник'}</div>
                    <div className={styles.playerScore}>{scores[opponent] || 0}</div>
                    <div className={styles.gesture}>
                        {lastGestures[opponent] && (
                            <>
                                {getGestureEmoji(lastGestures[opponent])}
                                <span className={styles.gestureName}>{getGestureName(lastGestures[opponent])}</span>
                            </>
                        )}
                        {!lastGestures[opponent] && '❓'}
                    </div>
                </div>
            </div>

            {countdown && (
                <div className={styles.countdown}>
                    <div className={styles.countdownNumber}>{countdown}</div>
                    <div>Покажите жест или нажмите кнопку!</div>
                </div>
            )}

            {/* Кнопки выбора жестов */}
            {gameState === 'playing' && !selectedGesture && (
                <div className={styles.gestureButtons}>
                    <button onClick={() => handleManualGesture('rock')} className={styles.gestureBtnRock}>
                        👊 Камень
                    </button>
                    <button onClick={() => handleManualGesture('scissors')} className={styles.gestureBtnScissors}>
                        ✌️ Ножницы
                    </button>
                    <button onClick={() => handleManualGesture('paper')} className={styles.gestureBtnPaper}>
                        ✋ Бумага
                    </button>
                </div>
            )}

            {/* Индикация выбранного жеста */}
            {gameState === 'playing' && selectedGesture && (
                <div className={styles.gestureSelected}>
                    ✅ Вы выбрали: {getGestureName(selectedGesture)} {getGestureEmoji(selectedGesture)}
                    <br />
                    <small>Ожидаем соперника...</small>
                </div>
            )}

            {roundResult && (
                <div className={`${styles.roundResult} ${styles[roundResult.result]}`}>
                    {roundResult.winner === username ? '🎉 Вы выиграли раунд!' : 
                     roundResult.result === 'draw' ? '🤝 Ничья!' : 
                     '💔 Вы проиграли раунд!'}
                </div>
            )}
        </div>
    );
};

export default OnlineGame;