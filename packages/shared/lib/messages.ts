export interface IClipsheetMessage<K extends string, P extends Record<string, unknown>> {
    type: K;
    payload: P;
}
