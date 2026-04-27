// Жесты
export const GESTURES = {
    ROCK: 'rock',
    PAPER: 'paper',
    SCISSORS: 'scissors'
};

// Все жесты (для случайного выбора компьютера)
export const ALL_GESTURES = [GESTURES.ROCK, GESTURES.PAPER, GESTURES.SCISSORS];

// Отображение жестов
export const GESTURE_DISPLAY = {
    [GESTURES.ROCK]: { emoji: '👊', name: 'Камень' },
    [GESTURES.PAPER]: { emoji: '✋', name: 'Бумага' },
    [GESTURES.SCISSORS]: { emoji: '✌️', name: 'Ножницы' }
};

// Правила игры (ключ бьет значение)
export const WIN_RULES = {
    [GESTURES.ROCK]: GESTURES.SCISSORS,
    [GESTURES.SCISSORS]: GESTURES.PAPER,
    [GESTURES.PAPER]: GESTURES.ROCK
};

// Настройки игры
export const GAME_SETTINGS = {
    SCORE_TO_WIN: 3,
    ROUND_DELAY: 4000,
    COUNTDOWN_START: 3
};

// Результаты раунда
export const ROUND_RESULTS = {
    WIN: 'win',
    LOSE: 'lose',
    DRAW: 'draw'
};