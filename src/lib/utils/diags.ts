export interface IDiagnose {
    $severity: string;
    $message: string;
    $stack?: string;
}

export function createDiagnose(severity: string, message: string, stack: string): IDiagnose {
    return {
        $severity: severity,
        $message: message,
        $stack: stack
    };
}

export function addInstanceDiagnose(instance: any, severity: string, message: string, stack: string) {
    instance.$diagnoses = instance.$diagnoses || [];
    instance.$diagnoses.push(createDiagnose(severity, message, stack));
    return instance;
}