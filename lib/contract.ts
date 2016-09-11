export class Contract {
    static DB_CONNECTION: string  = "mongodb://localhost/spirit";
    static MODELS = {
        "User": {}
    };
}
Object.seal(Contract);