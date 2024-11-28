// import type { IDrillDownColumn } from '@chrome-extension-boilerplate/shared';
// import { coverHelper, generateRandomId, requestElementInspection, requestUpperElement } from '@chrome-extension-boilerplate/shared';

// import { Dialog } from '@src/components/Dialog';
import { useEffect, useState } from 'react';
// import { t } from '../../locale';
import type { IDrillDownColumn } from '@univer-clipsheet-core/scraper';
import { Dialog } from '@components/Dialog';
import { coverHelper, requestElementInspection, requestUpperElement } from '@views/client';
import { generateRandomId } from '@univer-clipsheet-core/shared';
import { t } from '@univer-clipsheet-core/locale';
import { DrillDownColumnFormItem } from './DrillDownColumnFormItem';

export interface IDrillDownColumnDialogProps {
    data: IDrillDownColumn;
    visible: boolean;
    onVisibleChange?: (visible: boolean) => void;
    onCancel?: () => void;
    onChange?: (data: IDrillDownColumn) => void;
}

export const DrillDownColumnDialog = (props: IDrillDownColumnDialogProps) => {
    const { data, visible, onVisibleChange, onChange, onCancel } = props;

    const [inspecting, setInspecting] = useState(false);
    const [innerData, setInnerData] = useState<IDrillDownColumn>(data);

    useEffect(() => {
        if (visible) {
            setInnerData({ ...data });
        }
    }, [visible]);

    return (
        <Dialog visible={visible} closable={false} classNames={{ wrapper: 'flex items-center justify-center', body: '!p-0', content: 'w-[336px]' }}>
            <DrillDownColumnFormItem
                border={false}
                data={innerData}
                inspecting={inspecting}
                onChange={(key, value) => {
                    setInnerData({ ...innerData, [key]: value });
                }}
                onUpperClick={() => {
                    requestUpperElement(innerData.selector)
                        .then((selector) => {
                            if (selector) {
                                setInnerData({
                                    ...innerData,
                                    selector,
                                });

                                const id = generateRandomId();
                                coverHelper.addCover(id, selector);
                                setTimeout(() => {
                                    coverHelper.removeCover(id);
                                }, 1000);
                            }
                        });
                }}
                onInspectClick={() => {
                    setInspecting(true);

                    requestElementInspection()
                        .then((selectors) => {
                            setInnerData({
                                ...innerData,
                                selector: selectors.selector,
                            });
                        })
                        .finally(() => {
                            setInspecting(false);
                        });
                }}
            />
            <footer className="flex justify-end px-3 pb-4 pt-0.5">
                <div>

                    <button
                        onClick={() => {
                            onCancel?.();
                            onVisibleChange?.(false);
                        }}
                        className="grow mr-3 px-3 py-[7px] border border-gray-200  rounded-full text-center text-gray-900"
                    >
                        {t('Cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onChange?.(innerData);
                            onVisibleChange?.(false);
                        }}
                        className="grow px-3 py-[7px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] text-white rounded-full text-center"
                    >
                        {t('Confirm')}
                    </button>
                </div>
            </footer>
        </Dialog>
    );
};
