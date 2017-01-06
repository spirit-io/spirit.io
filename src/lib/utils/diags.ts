export interface IDiagnose {
    $severity: string;
    $message: string;
    $stack?: string;
}

export function createDiagnose(severity: string, message: string, stack?: string): IDiagnose {
    let d: any = {
        $severity: severity,
        $message: message
    };
    if (stack) d.$stack = stack;
    return d;
}

export function addInstanceDiagnose(instance: any, severity: string, message: string, stack?: string) {
    instance.$diagnoses = instance.$diagnoses || [];
    instance.$diagnoses.push(createDiagnose(severity, message, stack));
    return instance;
}