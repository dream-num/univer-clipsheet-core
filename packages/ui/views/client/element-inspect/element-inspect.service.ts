import type { IMessage } from '@univer-clipsheet-core/shared';
import { findElementBySelector, generateUniqueSelectorLastOf, getCellData, getDrillDownSelector, resolveTypeByElement } from '@univer-clipsheet-core/table';
import { findUniqueSelector, findUpperParent } from '../tools';
import { ElementInspectController } from './element-inspect.controller';
import type { RequestUpperElementMessage, ResponseElementInspectionMessage, ResponseUpperElementMessage } from './element-inspect.message';
import { ElementInspectMessageTypeEnum } from './element-inspect.message';

export class ElementInspectService {
    private _controller = new ElementInspectController();

    get controller() {
        return this._controller;
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg:
            RequestUpperElementMessage
            | IMessage<ElementInspectMessageTypeEnum.StopElementInspection>
            | IMessage<ElementInspectMessageTypeEnum.RequestElementInspection>) => {
            const { _controller } = this;
            switch (msg.type) {
                case ElementInspectMessageTypeEnum.RequestElementInspection : {
                    _controller.activate();
                    _controller.onInspectElement((el) => {
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

                        _controller.deactivate();
                    });
                    break;
                }
                case ElementInspectMessageTypeEnum.StopElementInspection: {
                    this._controller.deactivate();
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
