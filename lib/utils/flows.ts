import { funnel } from 'f-promise';

export function synchronize() {
    let _funnel = funnel(1);
    function synchronize(target: any, propertyKey: string, descriptor: any) {
        return _funnel(() => {
            return descriptor;
        });

    }
    return synchronize;
}
