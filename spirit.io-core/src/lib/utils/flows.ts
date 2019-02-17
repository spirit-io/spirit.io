import { funnel } from 'f-promise';

export function synchronize() {
    const _funnel = funnel(1);
    function _synchronize(target: any, propertyKey: string, descriptor: any) {
        return _funnel(() => {
            return descriptor;
        });
    }
    return _synchronize;
}
