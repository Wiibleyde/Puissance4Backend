export enum GameStatus {
    STANDBY = 'STANDBY',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED'
}

export enum WinnerType {
    NO_WINNER = 'NO_WINNER',
    PLAYER = 'PLAYER',
    DRAW = 'DRAW'
}

export class Puissance4Game {
    private _status: GameStatus = GameStatus.STANDBY;
    private _board: number[][] = [];
    private _players: string[] = [];
    private _currentPlayer: string = '';
    private _winner: string = '';
    private _winnerType: WinnerType = WinnerType.NO_WINNER;
    private _boardWidth: number = 7;
    private _turns: number = 0;

    constructor(players: string[], boardWidth: number = 7, boardHeight: number = 6) {
        this._players = players;
        this._boardWidth = boardWidth;
        this._board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
    }

    get status(): GameStatus {
        return this._status;
    }

    get board(): number[][] {
        return this._board;
    }

    get players(): string[] {
        return this._players;
    }

    set players(players: string[]) {
        this._players = players;
    }

    get currentPlayer(): string {
        return this._currentPlayer;
    }

    get winner(): string {
        return this._winner;
    }

    get winnerType(): WinnerType {
        return this._winnerType;
    }

    get boardWidth(): number {
        return this._boardWidth
    }

    get turns(): number {
        return this._turns;
    }

    startGame(): void {
        this._status = GameStatus.IN_PROGRESS;
        this._currentPlayer = this._players[0];
    }

    play(column: number): void {
        if (this._status !== GameStatus.IN_PROGRESS) {
            throw new Error('Game is not in progress');
        }

        if (column < 0 || column >= this._boardWidth) {
            throw new Error('Invalid column');
        }

        const row = this._board.findIndex((row) => row[column] === 0);
        if (row === -1) {
            throw new Error('Column is full');
        }

        this._board[row][column] = this._players.indexOf(this._currentPlayer) + 1;
        if (this.checkWinner(row, column)) {
            this._status = GameStatus.FINISHED;
            this._winner = this._currentPlayer;
            this._winnerType = WinnerType.PLAYER;
        } else if (this.isBoardFull()) {
            this._status = GameStatus.FINISHED;
            this._winner = 'Draw';
            this._winnerType = WinnerType.DRAW;
        } else {
            const currentPlayerIndex = this._players.indexOf(this._currentPlayer);
            this._currentPlayer = this._players[(currentPlayerIndex + 1) % this._players.length];
            this._turns++;
        }
    }

    private checkWinner(row: number, column: number): boolean {
        const player = this._players.indexOf(this._currentPlayer) + 1;
        return (
            this.checkDirection(row, column, 0, 1, player) ||
            this.checkDirection(row, column, 1, 0, player) ||
            this.checkDirection(row, column, 1, 1, player) ||
            this.checkDirection(row, column, 1, -1, player)
        );
    }

    private checkDirection(row: number, column: number, rowIncrement: number, columnIncrement: number, player: number): boolean {
        const count = this.countInDirection(row, column, rowIncrement, columnIncrement, player);
        return count >= 4;
    }

    private countInDirection(row: number, column: number, rowIncrement: number, columnIncrement: number, player: number): number {
        let count = 1;
        let r = row + rowIncrement;
        let c = column + columnIncrement;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && this._board[r][c] === player) {
            count++;
            r += rowIncrement;
            c += columnIncrement;
        }
        r = row - rowIncrement;
        c = column - columnIncrement;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && this._board[r][c] === player) {
            count++;
            r -= rowIncrement;
            c -= columnIncrement;
        }
        return count;
    }

    private isBoardFull(): boolean {
        return this._board.every(row => row.every(cell => cell !== 0));
    }

    printBoard(): void {
        console.log(this._board.map((row) => row.join(' ')).join('\n'));
    }

    toJson(): string {
        return JSON.stringify({
            status: this._status,
            board: this._board,
            players: this._players,
            currentPlayer: this._currentPlayer,
            winner: this._winner,
            winnerType: this._winnerType,
            turns: this._turns
        });
    }

    isCurrentPlayer(player: string): boolean {
        return this._currentPlayer === player;
    }
}