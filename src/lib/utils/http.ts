import { HttpError } from '../utils';

export function badAuthMethod(authMethod: string): HttpError {
    return badRequest("Bad authentication method: " + authMethod);
}

export function badRequest(text: string): HttpError {
    return new HttpError(400, text);
}

export function unauthorized(): HttpError {
    return new HttpError(401, 'Authorization required');
}