
import React from 'react';
import { t } from '@univer-clipsheet-core/locale';
import { LoadingSvg } from '../icons';
import '../tailwind.css';

export interface IRunButtonProps {
    running: boolean;
    onStart?: () => void;
    onStop?: () => void;
    stopText?: React.ReactNode;
    startText?: React.ReactNode;
}

export const RunButton = (props: IRunButtonProps) => {
    const {
        running,
        onStart,
        onStop,
        startText = t('Start'),
        stopText = t('Stop'),
    } = props;

    if (running) {
        return (
            <button type="button" onClick={onStop} className="rounded-full text-[#F05252] py-1 px-2 border border-[#F05252] border-solid inline-flex items-center bg-white hover:bg-gray-50">
                <LoadingSvg className="animate-spin mr-1" />
                {stopText}
            </button>
        );
    } else {
        return (
            <button type="button" onClick={onStart} className="rounded-full text-[#0E111E] py-1 px-2 border border-[#E3E5EA] border-solid bg-white hover:bg-gray-50">
                {startText}
            </button>
        );
    }
};
