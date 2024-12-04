import { findElementBySelector, getDrillDownSelector } from '@univer-clipsheet-core/table';

interface RemountObserveInit {
    generateSelector?: (el: HTMLElement) => string;
    onRemove?: () => void;
    onRemount?: (newElement: HTMLElement) => void;
}

interface IObservedElementInfo {
    element: HTMLElement;
    selector: string;
    generateSelector: (el: HTMLElement) => string;
    onRemount: (el: HTMLElement) => void;
    onRemove?: () => void;
    disposeCallbacks: (() => void)[];
}

export class RemountObserver {
    private _elementInfoMap = new Map<HTMLElement, IObservedElementInfo>();
    private _observed = false;

    private get _elementInfos() {
        return Array.from(this._elementInfoMap.values());
    }

    private _observer = new MutationObserver((mutations) => {
        const { _elementInfoMap, _elementInfos } = this;
        mutations.forEach((mutation) => {
            const elements = Array.from(_elementInfoMap.keys());
            mutation.removedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }
                const element = elements.find((el) => node.contains(el));
                if (element && element !== node) {
                    /**
                     * the node is contained the element we are observing
                     * the parent of observed element will be removed, we need add parent element to observation list
                     * and parent element re-added to dom, we should notify its children we were observing element
                     */
                    const elementInfo = _elementInfoMap.get(element);
                    if (elementInfo) {
                        const disposeObservation = this.observe(node, {
                            generateSelector: getDrillDownSelector,
                            onRemount: () => {
                                const foundElement = findElementBySelector(elementInfo.selector);
                                if (foundElement && elementInfo.element !== foundElement) {
                                    setTimeout(() => {
                                        elementInfo.onRemount(foundElement);
                                    });
                                }
                            },
                        });
                        elementInfo.disposeCallbacks.push(disposeObservation);
                    }
                }

                const elementInfo = element && _elementInfoMap.get(element);
                if (elementInfo) {
                    elementInfo.onRemove?.();
                }
            });

            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }

                const elementInfo = _elementInfos.find((info) => info.generateSelector(node) === info.selector);

                if (elementInfo) {
                    elementInfo.onRemount?.(node);
                }
            });
        });
    });

    private _updateElementReference(info: IObservedElementInfo, newElement: HTMLElement) {
        const { _elementInfoMap } = this;

        const oldElement = info.element;
        _elementInfoMap.delete(oldElement);
        _elementInfoMap.set(newElement, {
            ...info,
            element: newElement,
        });
    }

    private _cleanupElement(element: HTMLElement) {
        const { _elementInfoMap } = this;
        const elementInfo = _elementInfoMap.get(element);
        if (elementInfo) {
            elementInfo.disposeCallbacks.forEach((cb) => cb());
            _elementInfoMap.delete(element);
        }
        if (_elementInfoMap.size === 0) {
            this._observed = false;
            this._observer.disconnect();
        }
    }

    observe(element: HTMLElement, options: RemountObserveInit) {
        const { onRemount, onRemove, generateSelector = getDrillDownSelector } = options;

        const { _elementInfoMap } = this;

        const selector = generateSelector(element);

        const oldElementInfo = this._elementInfos.find((info) => info.selector === selector);
        if (oldElementInfo) {
            this._updateElementReference(oldElementInfo, element);

            return () => {
                this._cleanupElement(element);
            };
        }

        const elementInfo: IObservedElementInfo = {
            element,
            selector,
            generateSelector,
            onRemount: (newElement) => {
                this._updateElementReference(elementInfo, newElement);
                onRemount?.(newElement);
            },
            onRemove,
            disposeCallbacks: [],
        };

        _elementInfoMap.set(element, elementInfo);

        if (!this._observed) {
            this._observed = true;
            this._observer.observe(document.body, { childList: true, subtree: true });
        }

        return () => {
            this._cleanupElement(element);
        };
    }

    clear() {
        const { _elementInfoMap } = this;
        _elementInfoMap.clear();

        this._observed = false;
        this._observer.disconnect();
    }

    dispose() {
        this.clear();
    }
}
