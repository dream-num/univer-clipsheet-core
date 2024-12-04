export interface IClientChannel {
    test(name: string): boolean;
    connect(name: string): void;
}
