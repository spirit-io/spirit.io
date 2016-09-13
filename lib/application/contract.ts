export class Contract {

    public db: any;
    constructor(private config: any = {
        db: "mongodb://localhost/spirit"
    }) {
        this.db = config.db;
    };



    static MODELS = {
        "User": {}
    };
}
Object.seal(Contract);