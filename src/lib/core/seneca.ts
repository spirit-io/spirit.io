import * as sns from 'seneca';
import { wait } from 'f-promise';
import * as bluebird from 'bluebird';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as debug from 'debug';
const trace = debug('sio:service');

export class Service {
    private static initialized: boolean = false;
    public static instance: sns.Instance;
    private static _acts: Map<String, Function> = new Map();
    public static init(config: any) {
        if (this.initialized) return;

        this.instance = sns();
        this.instance.use('basic').use('entity');
        // TODO: Manage maps

        if (config.store) {
            this.instance.use(config.store.name, config.store.connection);
        }

        this._acts.set('local', bluebird.promisify(this.instance.act, { context: this.instance }));
        this.listen(config);


        if (config.services) Object.keys(config.services).forEach((name) => {
            let client = sns().client(config.services[name])
            this._acts.set(name, bluebird.promisify(client.act, { context: client }))
        });

        this.initialized = true;
    }


    private static listen(config: any) {
        let options: any = {
            type: 'http',
            host: config.host || os.hostname(),
            port: config.port || (config.https ? 443 : 80)
        }
        if (config.https) {
            if (!config.certs) throw new Error('`certs` config should reference certificates directory when HTTPS is enabled');
            const certPath = path.resolve(config.certs);
            const key = fs.readFileSync(path.join(certPath, 'key.pem'));
            if (!key) throw new Error(`'key.pem' file should exist in certificate directory: ${certPath}`);
            const cert = fs.readFileSync(path.join(certPath, 'cert.pem'));
            if (!cert) throw new Error(`'cert.pem' file should exist in certificate directory: ${certPath}`);

            options.protocol = 'https';
            options.serverOptions = {
                key: key,
                cert: cert
            };
        }
        this.instance.listen(options);
        trace("Local service listens on:", options)
    }

    public static act(pattern: String | Object, msg: Object, service?: String): any {
        service = service || 'local';
        msg = msg || {};
        let act = this._acts.get(service);
        if (!act) throw new Error(`Service ${service} not configured`);
        return wait(act(pattern, msg));
    }
}