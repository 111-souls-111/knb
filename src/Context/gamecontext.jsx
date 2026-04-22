import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { WIN_RULES, GAME_SETTINGS, ROUND_RESULTS } from '../utils/gameConstants';

// Начальное состояние
const initialState = {
    playerScore: 0,
    computerScore: 0,
    playerGesture: null,
    computerGesture: null,
    roundResult: null,
    gameStatus: 'waiting', // waiting, countdown, roundEnd, gameOver
    winner: null,
    countdown: null
};

// Типы действий
const ACTIONS = {
    START_GAME: 'START_GAME',
    START_COUNTDOWN: 'START_COUNTDOWN',
    UPDATE_COUNTDOWN: 'UPDATE_COUNTDOWN',
    SET_GESTURES: 'SET_GESTURES',
    FINISH_ROUND: 'FINISH_ROUND',
    NEXT_ROUND: 'NEXT_ROUND',
    RESET_GAME: 'RESET_GAME'
};

// Редюсер
const gameReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.START_GAME:
            return {
                ...initialState,
                gameStatus: 'countdown'
            };

        case ACTIONS.START_COUNTDOWN:
            return {
                ...state,
                gameStatus: 'countdown',
                countdown: GAME_SETTINGS.COUNTDOWN_START
            };

        case ACTIONS.UPDATE_COUNTDOWN:
            return {
                ...state,
                countdown: action.payload
            };

        case ACTIONS.SET_GESTURES:
            return {
                ...state,
                playerGesture: action.payload.player,
                computerGesture: action.payload.computer,
                gameStatus: 'roundEnd'
            };

        case ACTIONS.FINISH_ROUND:
            return {
                ...state,
                roundResult: action.payload.result,
                playerScore: action.payload.playerScore,
                computerScore: action.payload.computerScore,
                gameStatus: action.payload.gameOver ? 'gameOver' : 'roundEnd'
            };

        case ACTIONS.NEXT_ROUND:
            return {
                ...state,
                playerGesture: null,
                computerGesture: null,
                roundResult: null,
                gameStatus: 'countdown',
                countdown: null
            };

        case ACTIONS.RESET_GAME:
            return initialState;

        default:
            return state;
    }
};

// Создаем контекст
const GameContext = createContext(null);

export const GameProvider = ({children}) => {
    const [state, dispath] = useReducer(gameReducer, initialState);

    const getRoundWinner = useCallback( (player,computer) => {
        if (player === computer) return ROUND_RESULTS.DRAW;
        if (WIN_RULES[player] === computer) return ROUND_RESULTS.WIN;
        return ROUND_RESULTS.LOSE;
    }, []);

    const finishRound = useCallback( (playerGesture, computerGesture) =>
    {
        const result = getRoundWinner(playerGesture,computerGesture)
        let newPlayerScore = state.playerScore;
        let newComputerScore = state.computerScore;

        if (result === ROUND_RESULTS.WIN) newPlayerScore++;
        if (result === ROUND_RESULTS.LOSE) newComputerScore++;

        const gameOver = newPlayerScore >= GAME_SETTINGS.SCORE_TO_WIN || 
        newComputerScore >= GAME_SETTINGS.SCORE_TO_WIN;

        dispath({
            type: ACTIONS.FINISH_ROUND,
            payload: {
                result, 
                playerScore: newPlayerScore,
                computerScore: newComputerScore,
                gameOver
            }
        });
        return {result, gameOver}
    }, [state.playerScore, state.computerScore, getRoundWinner]);

    const startGame = useCallback(() => dispath({ type: ACTIONS.START_GAME}),[]);
    const startCountdown = useCallback(() => dispath({ type: ACTIONS.START_COUNTDOWN}),[])
    const updateCountdown = useCallback((value) => dispath({ type: ACTIONS.UPDATE_COUNTDOWN, payload: value }), []);
    const setGestures = useCallback((player, computer) => dispath({ type: ACTIONS.SET_GESTURES, payload: { player, computer } }), []);
    const nextRound = useCallback(() => dispath({ type: ACTIONS.NEXT_ROUND }), []);
    const resetGame = useCallback(() => dispath({ type: ACTIONS.RESET_GAME }), []);

    const value = {
        ...state,
        startGame,
        startCountdown,
        updateCountdown,
        setGestures,
        finishRound,
        nextRound,
        resetGame
    };

    return (
        <GameContext.Provider value ={value}>
            {children}
        </GameContext.Provider>
    );

};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within GameProvider');
    return context;
}

