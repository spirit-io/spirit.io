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
    public static clients: Map<String, sns.Instance> = new Map();

    public static init(config: any) {
        if (this.initialized) return;

        this.instance = sns();
        this.instance.use('basic').use('entity');
        // TODO: Manage maps

        if (config.store) {
            this.instance.use(config.store.name, config.store.connection);
        }
        this.instance['actAsync'] = bluebird.promisify(this.instance.act, { context: this.instance })
        this.clients.set('local', this.instance);
        this.listen(config);


        if (config.services) Object.keys(config.services).forEach((name) => {
            let inst = sns().client(config.services[name]);
            inst['actAsync'] = bluebird.promisify(inst.act, { context: inst });
            this.clients.set(name, inst);
        });

        if (config['services-mock']) Object.keys(config['services-mock']).forEach((name) => {
            let inst = config['services-mock'][name]();
            inst['actAsync'] = bluebird.promisify(inst.act, { context: inst });
            this.clients.set(name, inst);
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
        let client = this.clients.get(service);
        if (!client) throw new Error(`Service ${service} not configured`);
        return wait((<any>client).actAsync(pattern, msg));
    }
}