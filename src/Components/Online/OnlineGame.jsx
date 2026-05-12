import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { authService } from '../../services/authservice';
import styles from './OnlineGame.module.css';

const OnlineGame = () => {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState('searching'); // searching, waiting, playing, gameOver
    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState({});
    const [roundResult, setRoundResult] = useState(null);
    const [lastGestures, setLastGestures] = useState({});
    const [waitingMessage, setWaitingMessage] = useState('Поиск соперника...');
    const currentGesture = useRef(null);

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
            setWaitingMessage('Ожидание соперника...');
            setRoom(data.room);
        });

        newSocket.on('game_start', (data) => {
            setGameState('playing');
            setPlayers(data.players);
            setRoom(data.room);
            setScores({});
            setRoundResult(null);
            setWaitingMessage('');
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

            if (data.game_winner) {
                setGameState('gameOver');
                setTimeout(() => {
                    setGameState('searching');
                    newSocket.emit('find_game', { username });
                }, 3000);
            } else {
                setTimeout(() => {
                    setRoundResult(null);
                    setLastGestures({});
                    currentGesture.current = null;
                }, 2000);
            }
        });

        return () => newSocket.close();
    }, []);

    const sendGesture = (gesture) => {
        if (gameState !== 'playing') return;
        if (currentGesture.current) return;
        
        currentGesture.current = gesture;
        socket.emit('make_gesture', {
            room: room,
            username: authService.getUsername(),
            gesture: gesture
        });
    };

    const getGestureEmoji = (gesture) => {
        const emojis = {
            rock: '👊',
            paper: '✋',
            scissors: '✌️'
        };
        return emojis[gesture] || '❓';
    };

    if (gameState === 'searching' || gameState === 'waiting') {
        return (
            <div className={styles.onlineContainer}>
                <div className={styles.searchingCard}>
                    <div className={styles.loader}></div>
                    <h2>{waitingMessage}</h2>
                    <p>🎮 Игроков в очереди: {gameState === 'searching' ? '1' : '2'}</p>
                </div>
            </div>
        );
    }

    if (gameState === 'gameOver') {
        const username = authService.getUsername();
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

    const username = authService.getUsername();
    const opponent = players.find(p => p !== username);

    return (
        <div className={styles.onlineContainer}>
            <div className={styles.gameHeader}>
                <div className={styles.playerCard}>
                    <div className={styles.playerName}>👤 {username}</div>
                    <div className={styles.playerScore}>{scores[username] || 0}</div>
                </div>
                <div className={styles.vs}>VS</div>
                <div className={styles.playerCard}>
                    <div className={styles.playerName}>👾 {opponent || 'Соперник'}</div>
                    <div className={styles.playerScore}>{scores[opponent] || 0}</div>
                </div>
            </div>

            {roundResult && (
                <div className={`${styles.roundResult} ${styles[roundResult.result]}`}>
                    {roundResult.winner === username ? '🎉 Вы выиграли раунд!' : 
                     roundResult.result === 'draw' ? '🤝 Ничья!' : 
                     '💔 Вы проиграли раунд!'}
                </div>
            )}

            <div className={styles.gesturesArea}>
                <div className={styles.myGesture}>
                    <div className={styles.gestureLabel}>Ваш жест</div>
                    <div className={styles.gestureEmoji}>
                        {currentGesture.current ? getGestureEmoji(currentGesture.current) : '❓'}
                    </div>
                </div>
                <div className={styles.opponentGesture}>
                    <div className={styles.gestureLabel}>Жест соперника</div>
                    <div className={styles.gestureEmoji}>
                        {lastGestures[opponent] ? getGestureEmoji(lastGestures[opponent]) : '❓'}
                    </div>
                </div>
            </div>

            <div className={styles.buttonsArea}>
                <h3>Выберите жест:</h3>
                <div className={styles.gestureButtons}>
                    <button onClick={() => sendGesture('rock')} className={styles.gestureBtn}>
                        👊 Камень
                    </button>
                    <button onClick={() => sendGesture('scissors')} className={styles.gestureBtn}>
                        ✌️ Ножницы
                    </button>
                    <button onClick={() => sendGesture('paper')} className={styles.gestureBtn}>
                        ✋ Бумага
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnlineGame;