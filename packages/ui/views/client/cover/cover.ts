import { generateRandomId, ObservableValue } from '@univer-clipsheet-core/shared';

const mediaElementTags = ['IMG', 'VIDEO', 'AUDIO', 'IFRAME'];

interface IHighlightCoverOptions {
    color?: string;
    onCoverCreated?(cover: HTMLDivElement): void;
}

const resizeListeners = new Map<Element, () => void>();
const coverRemoveListeners = new Map<Element, () => void>();
const resizeObserver = new ResizeObserver((nodes) => {
    nodes.forEach((node) => {
        const listener = resizeListeners.get(node.target);
        listener?.();
    });
});
const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const nodes = Array.from(resizeListeners.keys()).filter((node) => node.contains(mutation.target));
            nodes.forEach((node) => {
                const listener = resizeListeners.get(node);
                listener?.();
            });
        }
        mutation.removedNodes.forEach((node) => {
            if (!(node instanceof Element)) {
                return;
            }
            const callback = coverRemoveListeners.get(node);
            callback?.();
        });
    });
});

class Cover<T extends HTMLElement> {
    private $cover: HTMLDivElement | null = null;
    private $target: T | null = null;

    private _mountEvent$ = new ObservableValue<[HTMLElement, boolean]>([document.body, false]);
    private _unmountEvent$ = new ObservableValue<HTMLElement>(document.body);
    static refIdCountMap = new Map<string, number>();

    public visible$ = new ObservableValue<boolean>(false);

    constructor(private _name: string, private _options?: IHighlightCoverOptions) {
        this._updateCoverRectWithMountedNode = this._updateCoverRectWithMountedNode.bind(this);

        this._mountEvent$.subscribe(this._updateCoverRectWithMountedNode);

        this._registerVisibleHook();
        this._registerResizeObserverHook();
        this._registerMountedNodeReferenceHook();
    }

    get target() {
        return this.$target;
    }

    private _registerVisibleHook() {
        this._mountEvent$.subscribe(() => {
            this.visible$.next(true);
        });
        this._unmountEvent$.subscribe(() => {
            this.visible$.next(false);
        });
    }

    private _registerResizeObserverHook() {
        let unobserve: (() => void) | undefined;
        this._mountEvent$.subscribe((event) => {
            const [mountedNode] = event;
            const { cover } = this;
            if (cover) {
                unobserve?.();
                coverRemoveListeners.set(cover, () => {
                    if (!mountedNode.contains(cover)) {
                        mountedNode.appendChild(cover);
                    }
                });
                unobserve = () => coverRemoveListeners.delete(cover);
            }
            resizeListeners.set(mountedNode, this._updateCoverRectWithMountedNode);
            resizeObserver.observe(mountedNode);
            mutationObserver.observe(mountedNode, { childList: true });
        });
        this._unmountEvent$.subscribe((mountedNode) => {
            unobserve?.();
            resizeListeners.delete(mountedNode);
            resizeObserver.unobserve(mountedNode);
            if (resizeListeners.size <= 0 && coverRemoveListeners.size <= 0) {
                mutationObserver.disconnect();
            }
        });
    }

    private _registerMountedNodeReferenceHook() {
        this._mountEvent$.subscribe((event) => {
            const [mountedNode, dirty] = event;
            const { refIdCountMap } = Cover;
            // dirty means the mounted node position has been modified
            if (dirty) {
                const refId = generateRandomId();
                mountedNode.dataset.cover_ref_id = refId;
                refIdCountMap.set(refId, 1);
            } else {
                const refId = mountedNode.dataset.cover_ref_id;
                refId
                    && refIdCountMap.has(refId)
                    && refIdCountMap.set(refId, refIdCountMap.get(refId)! + 1);
            }
        });
        this._unmountEvent$.subscribe((mountedNode) => {
            const { refIdCountMap } = Cover;
            const refId = mountedNode.dataset.cover_ref_id;
            if (refId && refIdCountMap.has(refId)) {
                const refCount = refIdCountMap.get(refId)! - 1;
                refIdCountMap.set(refId, refCount);
                if (refCount <= 0) {
                    mountedNode.style.position = 'static';
                    mountedNode.removeAttribute('data-cover_ref_id');
                    refIdCountMap.delete(refId);
                }
            }
        });
    }

    get cover() {
        return this.$cover;
    }

    setColor(color: string) {
        if (!this._options) {
            this._options = {};
        }
        this._options.color = color;
        this.$cover?.style.setProperty('background-color', color);
    }

    private _createCover() {
        const cover = this._coverElement();

        this._options?.onCoverCreated?.(cover);
        this.$cover = cover;

        return this.$cover;
    }

    protected _resolveTarget(target: T): T {
        return target;
    }

    protected _resolveMountedNode(target: T): HTMLElement | null {
        return target;
    }

    static isCoverElement(el: HTMLElement) {
        const dataset = el.dataset;
        return typeof dataset.cs_cover === 'string' && typeof dataset.cs_cover_name === 'string';
    }

    protected _coverElement(): HTMLDivElement {
        const { _name, _options } = this;
        const cover = document.createElement('div');
        cover.style.position = 'absolute';
        cover.style.top = '0';
        cover.style.left = '0';
        cover.style.setProperty('background-position', '0', 'important');
        cover.style.setProperty('margin', '0', 'important');
        cover.style.setProperty('padding', '0', 'important');
        cover.style.setProperty('width', '100%', 'important');
        cover.style.setProperty('height', '100%', 'important');
        cover.style.zIndex = '1000000';
        cover.dataset.cs_cover = generateRandomId();

        cover.dataset.cs_cover_name = _name;
        if (_options?.color) {
            cover.style.setProperty('background-color', _options.color);
        }

        return cover;
    }

    private _ensureMountedNodePosition(mountedNode: HTMLElement) {
        const computedStyle = window.getComputedStyle(mountedNode);
        if (computedStyle.position !== 'static') {
            return false;
        }
        mountedNode.style.position = 'relative';
        return true;
    }

    private _updateCoverRectWithMountedNode() {
        const { $target, $cover } = this;
        if (!$target || !$cover) {
            return;
        }

        const mountedNode = this._resolveMountedNode($target);
        if (!mountedNode) {
            return;
        }

        const coverStyle = $cover.style;

        const newWidth = mountedNode.scrollWidth > mountedNode.offsetWidth ? `${mountedNode.scrollWidth}px` : '100%';
        const newHeight = mountedNode.scrollHeight > mountedNode.offsetHeight ? `${mountedNode.scrollHeight}px` : '100%';

        if (coverStyle.width !== newWidth) {
            coverStyle.setProperty('width', newWidth, 'important');
        }
        if (coverStyle.height !== newHeight) {
            coverStyle.setProperty('height', newHeight, 'important');
        }
    }

    attach(target: T) {
        this.detach();
        this.$target = target;
        const mountedNode = this._resolveMountedNode(target);
        if (!mountedNode) {
            return;
        }

        const dirty = this._ensureMountedNodePosition(mountedNode);
        const cover = this._createCover();

        this._mountEvent$.next([mountedNode, dirty]);

        if (!mountedNode.contains(cover)) {
            mountedNode.appendChild(cover);
        }
    }

    detach() {
        const { $target, $cover } = this;
        if (!$target || !$cover) {
            return;
        }
        const mountedNode = this._resolveMountedNode($target);
        if (!mountedNode) {
            return;
        }

        this._unmountEvent$.next(mountedNode);
        if (mountedNode.contains($cover)) {
            mountedNode.removeChild($cover);
        }
        this.$target = null;
        this.$cover = null;
    }

    dispose() {
        this.detach();
        this.$cover = null;
        this._mountEvent$.dispose();
        this._unmountEvent$.dispose();
    }
}

export enum HighlightColor {
    Shallow = 'rgba(255,165,0,0.2)',
    Deep = 'rgba(255,165,0,0.4)',
}

export class HighlightCover extends Cover<HTMLElement> {
    constructor(options?: IHighlightCoverOptions) {
        const { onCoverCreated } = options || {};

        super('HighlightCover', {
            color: HighlightColor.Shallow,
            onCoverCreated(cover) {
                cover.dataset.clipsheet = 'true';
                cover.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, { capture: true });

                onCoverCreated?.(cover);
            },
        });
    }

    protected override _resolveMountedNode(target: HTMLElement): HTMLElement {
        if (mediaElementTags.includes(target.tagName)) {
            return target.parentElement!;
        }
        return target;
    }
}

export class IframeCover extends Cover<HTMLIFrameElement> {
    constructor() {
        super('IframeCover', {
            color: HighlightColor.Shallow,
        });
    }

    protected override _resolveMountedNode(target: HTMLIFrameElement) {
        return target.parentElement;
    }
}
