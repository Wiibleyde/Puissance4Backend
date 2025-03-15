import { Server } from "socket.io";
import { Puissance4Game, GameStatus } from "./puissance4";

enum MessageType {
    JOIN_ROOM = "join-room",
    LEAVE_ROOM = "leave-room",
    START_GAME = "start-game",
    PLAY_TURN = "play-turn",
    GAME_STATUS = "game-status",
    CREATE_GAME = "create-game",
    JOIN_GAME = "join-game",
}

class WebSSocket {
    private io: Server;
    private games: Map<string, Puissance4Game> = new Map();

    constructor() {
        this.io = new Server({
            cors: {
                origin: "http://localhost:3001", // Allow requests from this origin
                methods: ["GET", "POST"]
            }
        });
        this.io.on("connection", (socket) => {
            console.log("New client connected");

            socket.on(MessageType.JOIN_ROOM, (room: string, player: string) => this.handleJoinRoom(socket, room, player));
            socket.on(MessageType.LEAVE_ROOM, (room: string, player: string) => this.handleLeaveRoom(socket, room, player));
            socket.on(MessageType.START_GAME, (room: string) => this.handleStartGame(socket, room));
            socket.on(MessageType.PLAY_TURN, (room: string, column: number) => this.handlePlayTurn(socket, room, column));
            socket.on(MessageType.CREATE_GAME, (player: string) => this.handleCreateGame(socket, player));
            socket.on(MessageType.JOIN_GAME, (gameCode: string, player: string) => this.handleJoinGame(socket, gameCode, player));
            socket.on("disconnect", () => this.handleDisconnect());
            socket.on("error", (error: any) => this.handleError(socket, error));
        });

        console.log("Websocket server started on http://localhost:3000");

        this.io.listen(3000);
    }

    private handleJoinRoom(socket: any, room: string, player: string) {
        console.log("Join room", room);
        socket.join(room);
        if (!this.games.has(room)) {
            this.games.set(room, new Puissance4Game([player]));
        } else {
            const game = this.games.get(room);
            if (game && game.players.length < 2) {
                game.players.push(player);
            }
        }
        this.io.to(room).emit(MessageType.GAME_STATUS, this.games.get(room)?.toJson());
    }

    private handleLeaveRoom(socket: any, room: string, player: string) {
        console.log("Leave room", room);
        socket.leave(room);
        const game = this.games.get(room);
        if (game) {
            game.players = game.players.filter(p => p !== player);
            if (game.players.length === 0) {
                this.games.delete(room);
            }
        }
        this.io.to(room).emit(MessageType.GAME_STATUS, this.games.get(room)?.toJson());
    }

    private handleStartGame(socket: any, room: string) {
        console.log("Start game", room);
        const game = this.games.get(room);
        if (game && game.players.length === 2) {
            game.startGame();
            this.io.to(room).emit(MessageType.GAME_STATUS, game.toJson());
        }
    }

    private handlePlayTurn(socket: any, room: string, column: number) {
        console.log("Play turn", room, column);
        const game = this.games.get(room);
        const player = socket.id; // Assuming socket.id is used as player identifier
        if (game && game.status === GameStatus.IN_PROGRESS) {
            if (game.isCurrentPlayer(player)) {
                try {
                    game.play(column);
                    this.io.to(room).emit(MessageType.GAME_STATUS, game.toJson());
                } catch (error: any) {
                    socket.emit("error", error.message);
                }
            } else {
                socket.emit("error", "It's not your turn");
            }
        }
    }

    private handleCreateGame(socket: any, player: string) {
        console.log("Create game");
        const gameCode = Math.random().toString(36).substr(2, 9);
        const game = new Puissance4Game([player]);
        this.games.set(gameCode, game);
        socket.join(gameCode);
        socket.emit(MessageType.GAME_STATUS, game.toJson());
        socket.emit("game-code", gameCode);
    }

    private handleJoinGame(socket: any, gameCode: string, player: string) {
        console.log("Join game", gameCode);
        const game = this.games.get(gameCode);
        if (game) {
            try {
                game.addPlayer(player);
                socket.join(gameCode);
                this.io.to(gameCode).emit(MessageType.GAME_STATUS, game.toJson());
            } catch (error: any) {
                socket.emit("error", error.message);
            }
        } else {
            socket.emit("error", "Game not found");
        }
    }

    private handleDisconnect() {
        console.log("Client disconnected");
    }

    private handleError(socket: any, error: any) {
        console.error('Socket error:', error);
        socket.disconnect();
    }
}

export { WebSSocket, MessageType };