const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

const games = {};
const players = {};

io.on('connection', (socket) => {
    console.log('Новый пользователь подключен:', socket.id);

    socket.on('createGame', () => {
        const gameId = generateGameId();
        games[gameId] = {
            players: [socket.id],
            board: Array(9).fill(null),
            currentPlayer: 'X',
            status: 'waiting'
        };
        players[socket.id] = { gameId, symbol: 'X' };
        
        socket.join(gameId);
        socket.emit('gameCreated', { gameId, symbol: 'X' });
        console.log(`Игра создана: ${gameId}`);
    });

    socket.on('joinGame', (gameId) => {
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', 'Игра не найдена');
            return;
        }
        
        if (game.players.length >= 2) {
            socket.emit('error', 'Игра уже заполнена');
            return;
        }
        
        game.players.push(socket.id);
        game.status = 'playing';
        players[socket.id] = { gameId, symbol: 'O' };
        
        socket.join(gameId);
        socket.emit('gameJoined', { gameId, symbol: 'O' });
        
        io.to(gameId).emit('gameStart', {
            board: game.board,
            currentPlayer: game.currentPlayer
        });
        
        console.log(`Игрок присоединился к игре: ${gameId}`);
    });

    socket.on('makeMove', ({ gameId, cellIndex }) => {
        const game = games[gameId];
        const player = players[socket.id];
        
        if (!game || !player) return;
        
        if (game.board[cellIndex] !== null) return;
        if (game.currentPlayer !== player.symbol) return;
        
        game.board[cellIndex] = player.symbol;
        
        const winner = checkWinner(game.board);
        const isDraw = !winner && game.board.every(cell => cell !== null);
        
        if (winner) {
            game.status = 'finished';
            game.winner = winner;
            io.to(gameId).emit('gameOver', { winner, board: game.board });
        } else if (isDraw) {
            game.status = 'finished';
            io.to(gameId).emit('gameDraw', { board: game.board });
        } else {
            game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
            io.to(gameId).emit('updateGame', {
                board: game.board,
                currentPlayer: game.currentPlayer
            });
        }
    });

    socket.on('disconnect', () => {
        const player = players[socket.id];
        if (player) {
            const game = games[player.gameId];
            if (game) {
                io.to(player.gameId).emit('playerLeft');
                delete games[player.gameId];
            }
            delete players[socket.id];
        }
        console.log('Пользователь отключен:', socket.id);
    });
});

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Измените эти строки в конце server.js:
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);

});
// Добавьте в server.js обработчик leaveGame
socket.on('leaveGame', (gameId) => {
    const game = games[gameId];
    if (game) {
        // Удаляем игрока из игры
        const playerIndex = game.players.indexOf(socket.id);
        if (playerIndex > -1) {
            game.players.splice(playerIndex, 1);
        }
        
        // Если в игре не осталось игроков, удаляем игру
        if (game.players.length === 0) {
            delete games[gameId];
        } else {
            // Уведомляем оставшегося игрока
            io.to(gameId).emit('playerLeft');
        }
    }
    
    delete players[socket.id];
});
