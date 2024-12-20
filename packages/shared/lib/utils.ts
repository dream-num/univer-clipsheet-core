export function isFunction(value: any): value is Function {
    return typeof value === 'function';
}

export function waitFor(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};
