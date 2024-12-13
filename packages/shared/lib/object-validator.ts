
type FieldRules<T> = {
    [P in keyof T]: (value: T[P], target: T) => boolean;
};

export interface IObjectValidatorInit<T, K extends keyof T = keyof T> {
    requiredFields: K[];
    fieldRules: Partial<FieldRules<T>>;
}

export class ObjectValidator<T extends Record<string, any>> {
    constructor(private _init: IObjectValidatorInit<T>) {

    }

    validate(obj: any): obj is T {
        if (obj === null || obj === undefined || typeof obj !== 'object') {
            return false;
        }

        const { requiredFields, fieldRules } = this._init;

        for (const field of requiredFields) {
            if (!(field in obj)) {
                return false;
            }
        }

        for (const field in obj) {
            const ruler = fieldRules[field];
            if (!ruler) {
                continue;
            }

            if (!ruler(obj[field], obj)) {
                return false;
            }
        }

        return true;
    }
}

