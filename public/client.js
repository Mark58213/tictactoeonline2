const socket = io();
let currentGameId = null;
let playerSymbol = null;

// Главная страница
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    document.getElementById('createGame')?.addEventListener('click', () => {
        socket.emit('createGame');
    });

    document.getElementById('joinGame')?.addEventListener('click', () => {
        const gameId = document.getElementById('gameId').value.trim().toUpperCase();
        if (gameId.length === 6) {
            window.location.href = `/game.html?game=${gameId}`;
        } else {
            alert('Введите корректный код игры (6 символов)');
        }
    });

    socket.on('gameCreated', ({ gameId, symbol }) => {
        const link = `${window.location.origin}/game.html?game=${gameId}`;
        document.getElementById('gameLink').classList.remove('hidden');
        document.getElementById('linkInput').value = link;
        document.getElementById('gameCode').textContent = gameId;
    });

    socket.on('error', (message) => {
        alert(`Ошибка: ${message}`);
    });
}

// Страница игры
if (window.location.pathname === '/game.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        currentGameId = gameId;
        document.getElementById('currentGameId').textContent = gameId;
        initializeGame();
    } else {
        alert('Код игры не указан!');
        window.location.href = '/';
    }

    document.getElementById('backToMenu')?.addEventListener('click', () => {
        window.location.href = '/';
    });
}

function initializeGame() {
    socket.emit('joinGame', currentGameId);

    socket.on('gameJoined', ({ gameId, symbol }) => {
        playerSymbol = symbol;
        document.getElementById('playerSymbol').textContent = symbol;
        document.getElementById('playerSymbol').className = `symbol ${symbol.toLowerCase()}`;
        document.getElementById('waitingMessage').classList.add('hidden');
    });

    socket.on('gameStart', ({ board, currentPlayer }) => {
        updateBoard(board);
        updateCurrentPlayer(currentPlayer);
        document.getElementById('waitingMessage').classList.add('hidden');
    });

    socket.on('updateGame', ({ board, currentPlayer }) => {
        updateBoard(board);
        updateCurrentPlayer(currentPlayer);
        document.getElementById('message').textContent = '';
    });

    socket.on('gameOver', ({ winner, board }) => {
        updateBoard(board);
        const message = winner === playerSymbol ? 'Вы победили! 🎉' : 'Вы проиграли 😢';
        document.getElementById('message').textContent = message;
        document.getElementById('message').className = 'message ' + 
            (winner === playerSymbol ? 'success' : 'error');
    });

    socket.on('gameDraw', () => {
        document.getElementById('message').textContent = 'Ничья! 🤝';
        document.getElementById('message').className = 'message info';
    });

    socket.on('playerLeft', () => {
        document.getElementById('message').textContent = 'Противник покинул игру';
        document.getElementById('message').className = 'message error';
    });

    socket.on('error', (message) => {
        alert(`Ошибка: ${message}`);
        window.location.href = '/';
    });

    // Обработка кликов по клеткам
    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            if (!playerSymbol) return;
            
            const cellIndex = parseInt(cell.dataset.index);
            socket.emit('makeMove', { 
                gameId: currentGameId, 
                cellIndex 
            });
        });
    });
}

function updateBoard(board) {
    board.forEach((value, index) => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.textContent = value || '';
        cell.className = 'cell' + (value ? ` ${value.toLowerCase()}` : '');
    });
}

function updateCurrentPlayer(currentPlayer) {
    const element = document.getElementById('currentPlayer');
    element.textContent = currentPlayer;
    element.className = `symbol ${currentPlayer.toLowerCase()}`;
}