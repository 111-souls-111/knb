import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { useHandGesture } from '../../Hooks/UseHandGesture';
import { authService } from '../../services/authservice';
import { createSocket, ONLINE_URL } from '../../services/api';
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

    useEffect(() => {
        const username = authService.getUsername();
        if (!username) return;

        const newSocket = createSocket();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Connected to:', ONLINE_URL);
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
                    startCountdown();
                }, 2000);
            }
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

    useEffect(() => {
        if (gameState !== 'playing' || countdown !== null) return;
        
        const interval = setInterval(async () => {
            const video = webcamRef.current?.video;
            if (video && video.readyState === 4 && socket && room) {
                const gesture = await analyzeGesture(video);
                if (gesture !== 'none' && gesture !== detectedGesture) {
                    setDetectedGesture(gesture);
                    socket.emit('make_gesture', {
                        room: room,
                        username: authService.getUsername(),
                        gesture: gesture
                    });
                }
            }
        }, 500);
        
        return () => clearInterval(interval);
    }, [gameState, countdown, socket, room, analyzeGesture, detectedGesture]);

    const getGestureEmoji = (gesture) => {
        const emojis = { rock: '👊', paper: '✋', scissors: '✌️' };
        return emojis[gesture] || '❓';
    };

    const username = authService.getUsername();
    const opponent = players.find(p => p !== username);

    if (gameState === 'searching' || gameState === 'waiting') {
        return (
            <div className={styles.onlineContainer}>
                <div className={styles.searchingCard}>
                    <Webcam ref={webcamRef} audio={false} style={{ display: 'none' }} />
                    <div className={styles.loader}></div>
                    <h2>{gameState === 'searching' ? 'Поиск соперника...' : 'Ожидание соперника...'}</h2>
                    <p>🎮 Подготовьте камеру!</p>
                    {isModelLoading && <p>🔄 Загрузка модели...</p>}
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
            <Webcam ref={webcamRef} audio={false} className={styles.webcam} mirrored={true} />
            
            <div className={styles.gameHeader}>
                <div className={styles.playerCard}>
                    <div className={styles.playerName}>👤 {username}</div>
                    <div className={styles.playerScore}>{scores[username] || 0}</div>
                    <div className={styles.gesture}>{detectedGesture && getGestureEmoji(detectedGesture)}</div>
                </div>
                <div className={styles.vs}>VS</div>
                <div className={styles.playerCard}>
                    <div className={styles.playerName}>👾 {opponent || 'Соперник'}</div>
                    <div className={styles.playerScore}>{scores[opponent] || 0}</div>
                    <div className={styles.gesture}>{lastGestures[opponent] && getGestureEmoji(lastGestures[opponent])}</div>
                </div>
            </div>

            {countdown && (
                <div className={styles.countdown}>
                    <div className={styles.countdownNumber}>{countdown}</div>
                    <div>Покажите жест!</div>
                </div>
            )}

            {roundResult && (
                <div className={`${styles.roundResult} ${styles[roundResult.result]}`}>
                    {roundResult.winner === username ? '🎉 Вы выиграли раунд!' : 
                     roundResult.result === 'draw' ? '🤝 Ничья!' : '💔 Вы проиграли раунд!'}
                </div>
            )}
        </div>
    );
};

export default OnlineGame;