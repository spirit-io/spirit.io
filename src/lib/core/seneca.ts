import * as sns from 'seneca';
import { wait } from 'f-promise';
import * as bluebird from 'bluebird';

export class Seneca {
    private static initialized: boolean = false;
    public static instance;
    public static init(config) {

        this.instance = sns();
        this.instance.use('basic').use('entity');
        if (Seneca.initialized) return;

        // TODO: Manage maps

        if (config.store) {
            this.instance.use(config.store.name, config.store.connection);
        }

        Seneca.initialized = true;
    }

    public static act(pattern: any, msg?: any): any {
        let act = bluebird.promisify(this.instance.act, { context: this.instance });
        return wait((<any>act)(pattern, msg));
    }
}