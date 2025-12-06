// Страница игры
if (window.location.pathname === '/game.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        currentGameId = gameId;
        document.getElementById('currentGameId').textContent = gameId;
        initializeGame();
    } else {
        // Если нет кода игры, проверяем, не создаем ли мы игру
        checkIfCreatingGame();
    }

    document.getElementById('backToMenu')?.addEventListener('click', () => {
        socket.emit('leaveGame', currentGameId);
        window.location.href = '/';
    });

    document.getElementById('restartGame')?.addEventListener('click', () => {
        if (confirm('Создать новую игру? Текущая игра будет завершена.')) {
            socket.emit('leaveGame', currentGameId);
            window.location.href = '/';
        }
    });
}

function checkIfCreatingGame() {
    // Проверяем, не был ли пользователь создателем игры
    const savedGameId = localStorage.getItem('creatingGameId');
    if (savedGameId) {
        currentGameId = savedGameId;
        document.getElementById('currentGameId').textContent = savedGameId;
        initializeGame();
    } else {
        alert('Код игры не указан!');
        window.location.href = '/';
    }
}

function initializeGame() {
    // Сохраняем gameId в localStorage на случай перезагрузки
    localStorage.setItem('currentGameId', currentGameId);
    
    socket.emit('joinGame', currentGameId);

    socket.on('gameJoined', ({ gameId, symbol }) => {
        playerSymbol = symbol;
        document.getElementById('playerSymbol').textContent = symbol;
        document.getElementById('playerSymbol').className = `symbol ${symbol.toLowerCase()}`;
        document.getElementById('waitingMessage').classList.add('hidden');
        
        // Убираем флаг создания игры
        localStorage.removeItem('creatingGameId');
    });

    // ... остальной код initializeGame остается таким же ...

    socket.on('disconnect', () => {
        localStorage.removeItem('currentGameId');
        localStorage.removeItem('creatingGameId');
    });
}
