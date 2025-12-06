// Главная страница
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    document.getElementById('createGame')?.addEventListener('click', () => {
        socket.emit('createGame');
    });

    document.getElementById('joinGame')?.addEventListener('click', () => {
        const gameId = document.getElementById('gameId').value.trim().toUpperCase();
        if (gameId.length === 6) {
            joinGame(gameId);
        } else {
            alert('Введите корректный код игры (6 символов)');
        }
    });

    // Автоматическое присоединение по ссылке с кодом
    function joinGame(gameId) {
        socket.emit('joinGame', gameId);
    }

    socket.on('gameCreated', ({ gameId, symbol }) => {
        const link = `${window.location.origin}/game.html?game=${gameId}`;
        document.getElementById('gameLink').classList.remove('hidden');
        document.getElementById('linkInput').value = link;
        document.getElementById('gameCode').textContent = gameId;
        
        // Автоматически присоединяем создателя к его же игре
        setTimeout(() => {
            joinGame(gameId);
        }, 500);
    });

    socket.on('gameJoined', ({ gameId, symbol }) => {
        // Автоматический переход на страницу игры
        window.location.href = `/game.html?game=${gameId}`;
    });

    socket.on('error', (message) => {
        alert(`Ошибка: ${message}`);
    });

    // Если в URL уже есть код игры (например, при открытии ссылки)
    window.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdFromUrl = urlParams.get('game');
        
        if (gameIdFromUrl) {
            document.getElementById('gameId').value = gameIdFromUrl;
            document.getElementById('joinGame').click();
        }
    });
}
