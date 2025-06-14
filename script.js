const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-button');

const WIDTH = 600;
const HEIGHT = 600;
const ROWS = 4;
const COLS = 4;
const TILE_SIZE = WIDTH / COLS;
const MAX_SEQUENCE_LENGTH = 10;
const TIME_LIMIT = 1;
const BASE_TIME_LIMIT = 1;  // starting time
const TIME_INCREMENT = 1;   // add 1 second for each new round
let currentTimeLimit = BASE_TIME_LIMIT;


const DARK_GREEN = '#006400';
const LIGHT_GREEN = '#00FF00';
const DARKER_GREEN = '#004d00';
const BLACK = '#000000';

let sequence = [];
let playerSequence = [];
let gameRunning = false;
let score = 0;
let startTime;
let hoveredTile = null;
let showingSequence = false;
let lastTime = 0;
let deltaTime = 0;
let frameRate = 1000 / 60;
let timerActive = false;
let timeouts = [];


function drawGrid() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            ctx.fillStyle = DARK_GREEN;
            ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = BLACK;
            ctx.lineWidth = 2;
            ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function flashTile(row, col) {
    ctx.fillStyle = LIGHT_GREEN;
    ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    setTimeout(() => {
        ctx.fillStyle = DARK_GREEN;
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }, 300);
}

function playSequence(seq) {
    showingSequence = true;
    const flashDuration = 300;
    const delayBetweenFlashes = 150;
    const totalFlashTime = flashDuration + delayBetweenFlashes;

    seq.forEach(([row, col], index) => {
        const timeoutId = setTimeout(() => {
            if (!gameRunning) return;  // Don't flash if game over
            flashTile(row, col);
        }, index * totalFlashTime);
        timeouts.push(timeoutId);
    });

    const endTimeout = setTimeout(() => {
        showingSequence = false;
        startTimer();
    }, seq.length * totalFlashTime + 500);
    timeouts.push(endTimeout);
}

function clearAllTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
}


function startTimer() {
    startTime = Date.now();
    timerActive = true;
    requestAnimationFrame(update);
}


function update(currentTime) {
    deltaTime = currentTime - lastTime;

    if (deltaTime < frameRate) {
        requestAnimationFrame(update);
        return;
    }

    lastTime = currentTime;

    if (!gameRunning || showingSequence || !timerActive) {
        requestAnimationFrame(update);
        return;
    }

    const elapsedTime = (Date.now() - startTime) / 1000;
    const secondsLeft = Math.max(0, currentTimeLimit - elapsedTime);
    drawProgressBar(secondsLeft);

    if (secondsLeft === 0) {
        drawGameOver();
    }

    requestAnimationFrame(update);
}


function getTileClicked(x, y) {
    const row = Math.floor(y / TILE_SIZE);
    const col = Math.floor(x / TILE_SIZE);
    return [row, col];
}

function drawProgressBar(secondsLeft) {
    const barWidth = (secondsLeft / currentTimeLimit) * WIDTH;
    progressBar.style.width = `${barWidth}px`;
    progressBar.style.backgroundColor = 'red';
}

function drawGameOver(message = 'Game Over') {
    clearAllTimeouts();
    timerActive = false;  // also stop timer immediately
    finalScoreElement.textContent = score;
    gameOverScreen.querySelector('h2').textContent = message;
    gameOverScreen.classList.remove('hidden');
    startButton.textContent = 'Retry';
    startButton.classList.remove('hidden');
    gameRunning = false;
}



function resetGame() {
    sequence = [];
    playerSequence = [];
    score = 0;
    gameRunning = false;  // important: game not running after reset
    progressBar.style.width = '0';
    drawGrid();
    gameOverScreen.classList.add('hidden');
    startButton.classList.remove('hidden');  // always show start button after reset
}


function startNewRound() {
    if (sequence.length === MAX_SEQUENCE_LENGTH) {
        drawGameOver("CONGRATS");
        return;
    }

    score++;
    sequence.push([Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)]);

    // increase the time limit based on sequence length
    currentTimeLimit = BASE_TIME_LIMIT + (sequence.length - 1) * TIME_INCREMENT;

    setTimeout(() => {
        playSequence(sequence);
        playerSequence = [];
    }, 800);
}


function handleTileHover(event) {
    if (showingSequence || !gameRunning) return;

    const x = event.offsetX;
    const y = event.offsetY;

    if (x >= 0 && x <= WIDTH && y >= 0 && y <= HEIGHT) {
        const [row, col] = getTileClicked(x, y);
        hoveredTile = { row, col };
    } else {
        hoveredTile = null;
    }

    drawGrid();
    if (hoveredTile) {
        const { row, col } = hoveredTile;
        ctx.fillStyle = DARKER_GREEN;
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

canvas.addEventListener('click', (event) => {
    if (!gameRunning || showingSequence) return;

    const [row, col] = getTileClicked(event.offsetX, event.offsetY);
    playerSequence.push([row, col]);

    if (playerSequence[playerSequence.length - 1].toString() !== sequence[playerSequence.length - 1].toString()) {
        drawGameOver();
    }

    if (playerSequence.length === sequence.length) {
        timerActive = false;
        setTimeout(startNewRound, 1000);
    }

    hoveredTile = null;
});

canvas.addEventListener('mousemove', handleTileHover);

startButton.addEventListener('click', () => {
    resetGame();
    gameRunning = true;
    startNewRound();
});
