import React, { useRef } from 'react';
import type { IInputNumberProps } from '@components/input-number/InputNumber';
import { InputNumber } from '@components/input-number/InputNumber';
import { PAGE_URL_SLOT } from '@univer-clipsheet-core/scraper';
import { t } from '@univer-clipsheet-core/locale';
import { TipsSvg } from '@components/icons';
import { ScraperInput } from '@components/ScraperInput';
import { Tooltip } from '@components/tooltip';

export interface IPageUrlAutoExtractionFormProps {

    templateUrl: string;
    startPage: IInputNumberProps['value'];
    endPage: IInputNumberProps['value'];
    onTemplateUrlChange?: (value: string) => void;
    onChange?: (key: 'startPage' | 'endPage', value: number | undefined) => void;
    disabled?: boolean;
}

const oneHourSeconds = 3600;

export const PageUrlAutoExtractionForm = (props: IPageUrlAutoExtractionFormProps) => {
    const { templateUrl, startPage, endPage, disabled = false, onTemplateUrlChange, onChange } = props;
    const selectionStartRef = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-3">
            <div className="mb-1.5">
                <div className="flex items-center justify-between text-gray-900 text-xs mb-[6px]">
                    <div className="flex items-center">

                        <span>
                            {t('PageUrlTemplate')}
                            :
                        </span>
                        <Tooltip
                            align={{
                                autoArrow: false,
                            }}
                            placement="bottom"
                            overlay={(
                                <div className="w-[240px]">
                                    <div>
                                        {t('InsertPageNumberSlot', {
                                            slot: ` ${PAGE_URL_SLOT} `,
                                        })}
                                    </div>
                                    <code>
                                        <span>
                                            {t('Example')}
                                            :
                                        </span>
                                        <br />
                                        <span>
                                            {t('ReplacePageNumberFromUrlToTemplateUrl', {
                                                url: 'https://unknown.com/?p=1',
                                                templateUrl: `https://unknown.com/?p=${PAGE_URL_SLOT}`,
                                            })}
                                        </span>
                                    </code>
                                </div>
                            )}
                        >
                            <span className="ml-2 cursor-pointer text-gray-500">
                                <TipsSvg />
                            </span>
                        </Tooltip>
                    </div>
                    <div>
                        <button
                            type="button"
                            className="hover:bg-gray-100 text-blue-500 p-1 rounded"
                            onClick={() => {
                                if (disabled) {
                                    return;
                                }
                                onTemplateUrlChange?.(`${templateUrl.slice(0, selectionStartRef.current)}${PAGE_URL_SLOT}${templateUrl.slice(selectionStartRef.current)}`);
                                setTimeout(() => {
                                    const inputElement = inputRef.current;
                                    if (inputElement) {
                                        inputElement.focus();
                                        const selectionStart = selectionStartRef.current + PAGE_URL_SLOT.length;
                                        inputElement.setSelectionRange(selectionStart, selectionStart);
                                    }
                                }, 100);
                            }}
                        >
                            {t('Insert')}
                        </button>
                    </div>
                </div>
                <ScraperInput
                    ref={inputRef}
                    onBlur={(evt) => {
                        const { selectionStart } = evt.target;
                        if (selectionStart !== null) {
                            selectionStartRef.current = selectionStart;
                        }
                    }}
                    disabled={disabled}
                    className="w-full"
                    value={templateUrl}
                    type="text"
                    onChange={onTemplateUrlChange}
                />
            </div>
            <div className="flex items-center justify-between text-[#474D5] text-xs">
                <span>{t('StartPageNo')}</span>
                <div className="flex items-center">
                    <InputNumber disabled={disabled} min={0} value={startPage} max={endPage ?? oneHourSeconds} onChange={(v) => onChange?.('startPage', v)} />
                    <span className="ml-2">{t('Pages')}</span>
                </div>
            </div>
            <div className="flex items-center justify-between text-[#474D5] text-xs">
                <span>{t('EndPageNo')}</span>
                <div className="flex items-center">
                    <InputNumber disabled={disabled} min={startPage ?? 0} value={endPage} max={oneHourSeconds} onChange={(v) => onChange?.('endPage', v)} />
                    <span className="ml-2">{t('Pages')}</span>
                </div>
            </div>
        </div>
    );
};

