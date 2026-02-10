export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
