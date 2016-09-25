import { _ } from 'streamline-runtime';
const flows = require('streamline-runtime').flows;

export function synchronize() {
    let _funnel = flows.funnel(1);
    function synchronize(target: any, propertyKey: string, descriptor: any) {
        return _funnel(function(err, res) {
            if (err) throw err;
            return res;
        }, function(_) {
            return descriptor;
        });
    }
    return synchronize;
}
