import type { IInputNumberProps } from '@components/InputNumber';
import { InputNumber } from '@components/InputNumber';
import React from 'react';
import { t } from '@univer-clipsheet-core/locale';
import { ScraperInspectElementBar } from '../InspectElementBar';

export interface IClickAutoExtractionFormProps {
    selector: string;
    maxInterval: IInputNumberProps['value'];
    minInterval: IInputNumberProps['value'];
    onSelectorChange?: (selector: string) => void;
    onChange?: (key: 'minInterval' | 'maxInterval', value: number | undefined) => void;
    disabled?: boolean;
}

const oneHourSeconds = 3600;

export const ClickAutoExtractionForm = (props: IClickAutoExtractionFormProps) => {
    const {
        onSelectorChange,
        selector,
        maxInterval,
        minInterval,
        disabled = false,
        onChange } = props;

    return (
        <div className="flex flex-col gap-3">
            <ScraperInspectElementBar
                selector={selector}
                disabled={disabled}
                text={t(selector ? 'NextButton' : 'SelectNextButton')}
                onChange={(selectors) => onSelectorChange?.(selectors.lastOfSelector)}
                onUpperChange={onSelectorChange}
            />
            <div className="flex items-center justify-between text-[#474D5] text-xs">
                <span>{t('MinInterval')}</span>
                <InputNumber disabled={disabled} min={0} value={minInterval} max={maxInterval ?? oneHourSeconds} onChange={(v) => onChange?.('minInterval', v)} />
            </div>
            <div className="flex items-center justify-between text-[#474D5] text-xs">
                <span>{t('MaxInterval')}</span>
                <InputNumber disabled={disabled} min={minInterval ?? 0} value={maxInterval} max={oneHourSeconds} onChange={(v) => onChange?.('maxInterval', v)} />
            </div>
        </div>
    );
};

