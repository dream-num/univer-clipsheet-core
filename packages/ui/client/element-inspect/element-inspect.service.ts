import type { IMessage } from '@univer-clipsheet-core/shared';
import { findElementBySelector, generateUniqueSelectorLastOf, getCellData, getDrillDownSelector, resolveTypeByElement } from '@univer-clipsheet-core/table';
import { findUniqueSelector, findUpperParent } from '../tools';
import { ElementInspectShadowComponent } from './element-inspect-shadow-component';
import type { RequestUpperElementMessage, ResponseElementInspectionMessage, ResponseUpperElementMessage } from './element-inspect.message';
import { ElementInspectMessageTypeEnum } from './element-inspect.message';

export class ElementInspectService {
    private _shadowComponent = new ElementInspectShadowComponent();

    get shadowComponent() {
        return this._shadowComponent;
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg:
            RequestUpperElementMessage
            | IMessage<ElementInspectMessageTypeEnum.ConnectElementInspection>
            | IMessage<ElementInspectMessageTypeEnum.StopElementInspection>
            | IMessage<ElementInspectMessageTypeEnum.RequestElementInspection>) => {
            const { shadowComponent } = this;
            switch (msg.type) {
                case ElementInspectMessageTypeEnum.ConnectElementInspection: {
                    // console.log('connect element inspection');
                    shadowComponent.activate();
                    shadowComponent.onInspectElement((el) => {
                        const res: ResponseElementInspectionMessage = {
                            type: ElementInspectMessageTypeEnum.ResponseElementInspection,
                            payload: {
                                cellData: getCellData(el),
                                lastOfSelector: generateUniqueSelectorLastOf(el),
                                selector: getDrillDownSelector(el),
                                type: resolveTypeByElement(el),
                            },
                        };

                        chrome.runtime.sendMessage(res);
                    });
                    break;
                }
                case ElementInspectMessageTypeEnum.RequestElementInspection : {
                    shadowComponent.activate();
                    shadowComponent.onInspectElement((el) => {
                        const res: ResponseElementInspectionMessage = {
                            type: ElementInspectMessageTypeEnum.ResponseElementInspection,
                            payload: {
                                cellData: getCellData(el),
                                lastOfSelector: generateUniqueSelectorLastOf(el),
                                selector: getDrillDownSelector(el),
                                type: resolveTypeByElement(el),
                            },
                        };

                        chrome.runtime.sendMessage(res);

                        shadowComponent.deactivate();
                    });
                    break;
                }
                case ElementInspectMessageTypeEnum.StopElementInspection: {
                    shadowComponent.deactivate();
                    break;
                }
                case ElementInspectMessageTypeEnum.RequestUpperElement: {
                    const baseEl = findElementBySelector(msg.payload);
                    const res: ResponseUpperElementMessage = {
                        type: ElementInspectMessageTypeEnum.ResponseUpperElement,
                        payload: null,
                    };
                    if (!baseEl) {
                        chrome.runtime.sendMessage(res);
                        return;
                    }
                    const el = findUpperParent(baseEl);
                    res.payload = el ? findUniqueSelector(el) ?? null : null;
                    chrome.runtime.sendMessage(res);
                    break;
                }
            }
        });
    }
}
