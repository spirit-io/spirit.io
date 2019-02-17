import { IDiagnose } from './diags';

export class HttpError extends Error {
    public status: number;
    public error: string;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.error = message;
    }
}

export class InstanceError extends Error {
    public $diagnoses: IDiagnose[];
    public error: string;
    constructor(message: string, diagnose: IDiagnose[]) {
        super(message);
        this.$diagnoses = diagnose;
        this.error = message;
    }
}
