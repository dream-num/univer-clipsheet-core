import type { IInputNumberProps } from '@components/InputNumber';
import { InputNumber } from '@components/InputNumber';
import { t } from '@univer-clipsheet-core/locale';
import React from 'react';

export interface IScrollAutoExtractionFormProps {
    maxInterval: IInputNumberProps['value'];
    minInterval: IInputNumberProps['value'];
    onChange?: (key: 'minInterval' | 'maxInterval', value: number | undefined) => void;
    disabled?: boolean;
}

const oneHourSeconds = 3600;

export const ScrollAutoExtractionForm = (props: IScrollAutoExtractionFormProps) => {
    const { maxInterval, minInterval, onChange, disabled = false } = props;
    return (
        <div className="text-xs flex flex-col gap-3">
            <div className="flex items-center justify-between text-[#474D5] text-xs">
                <span>{t('MinInterval')}</span>
                <InputNumber onChange={(v) => onChange?.('minInterval', v)} disabled={disabled} min={0} value={minInterval} max={maxInterval ?? oneHourSeconds} />
            </div>
            <div className="flex items-center justify-between text-[#474D5] text-xs">
                <span>{t('MaxInterval')}</span>
                <InputNumber onChange={(v) => onChange?.('maxInterval', v)} disabled={disabled} min={minInterval ?? 0} value={maxInterval} max={oneHourSeconds} />
            </div>
        </div>
    );
};

