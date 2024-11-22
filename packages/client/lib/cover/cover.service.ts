import { HighlightCover } from './cover';

export class CoverService {
    private _coverMap: Map<string, HighlightCover> = new Map();

    addCover(id: string, element: HTMLElement) {
        const cover = new HighlightCover();
        cover.attach(element);
        this._coverMap.set(id, cover);
    }

    updateCover(id: string, element: HTMLElement) {
        const cover = this._coverMap.get(id);
        cover?.attach(element);
    }

    removeCover(id: string) {
        const cover = this._coverMap.get(id);
        cover?.dispose();
        this._coverMap.delete(id);
    }

    removeAllCovers() {
        this._coverMap.forEach((cover) => {
            cover.dispose();
        });
        this._coverMap.clear();
    }
}
