import { ObservableValue } from '@lib/observable-value';

export class WindowService {
    private _tabRecords = new Set<number>();
    private _templatePath: string = '';

    private _window: chrome.windows.Window | null = null;

    private _onWindowClosedSubscription$ = new ObservableValue<void>(undefined);

    get window() {
        return this._window;
    }

    setWindowTemplatePath(path: string) {
        this._templatePath = path;
    }

    async ensureWindow() {
        if (!this._window) {
            await this.createWindow();
        }

        return this._window!;
    }

    async createWindow() {
        const currentWindow = await chrome.windows.getCurrent();

        this._window = await chrome.windows.create({
            url: this._templatePath,
            width: currentWindow.width ?? 1280,
            height: currentWindow.height ?? 920,
            state: 'normal',
            focused: false,
        });
    }

    closeWindow() {
        if (this._window) {
            const windowId = this._window.id;
            this._window = null;

            windowId && chrome.windows.remove(windowId);
        }
    }

    onWindowClosed(callback: () => void) {
        return this._onWindowClosedSubscription$.subscribe(callback);
    }

    listenMessage() {
        chrome.windows.onRemoved.addListener((windowId) => {
            if (this._window && this._window.id === windowId) {
                this._window = null;
                this._onWindowClosedSubscription$.next();
            }
        });

        chrome.tabs.onCreated.addListener((tab) => {
            if (tab.id
                && tab.windowId === this._window?.id
                && tab.pendingUrl !== this._templatePath) {
                this._tabRecords.add(tab.id);
            }
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            this._tabRecords.delete(tabId);
            if (this._window && this._tabRecords.size === 0) {
                this.closeWindow();
            }
        });
    }
}
