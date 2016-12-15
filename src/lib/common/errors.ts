export class HttpError extends Error {
    status: number;
    error: string;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.error = message;
    }
}