export class Contract {

    private db: string;
    constructor(private config: any) {};

    get db(): string {
        return this.db;
    }

    static DB_CONNECTION: string  = "mongodb://localhost/spirit";
    static MODELS = {
        "User": {}
    };
}
Object.seal(Contract);