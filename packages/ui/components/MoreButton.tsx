import React from 'react';
import clsx from 'clsx';
import { MoreSvg } from '@components/icons';
import './index.css';

export type MoreButtonProps = Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'type' | 'children'>;

export const MoreButton = (props: MoreButtonProps) => {
    const { className, ...restProps } = props;
    return (
        <button {...restProps} type="button" className={clsx(className, 'p-1 hover:bg-[#EEEFF1] rounded-md text-[#0E111E]')}>
            <MoreSvg />
        </button>
    );
};
