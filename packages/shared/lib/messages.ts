
export interface IMessage<K extends string> {
    type: K;
}
export interface IMessageWithPayload<K extends string, p = unknown> extends IMessage<K> {
    payload: p;
}
