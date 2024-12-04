import React from 'react';
import clsx from 'clsx';
import { LoadingSvg } from './icons';
import './tailwind.css';

export interface ILoadingMaskProps {
    className?: string;
    loadingClassName?: string;
    text?: React.ReactNode;
}

export const LoadingMask = (props: ILoadingMaskProps) => {
    const { text, className, loadingClassName } = props;
    return (
        <div className={clsx('absolute left-0 top-0 w-full h-full bg-slate-50 bg-opacity-80 flex items-center justify-center', className)}>
            <div className="flex flex-col items-center ">
                <LoadingSvg className={clsx(loadingClassName, 'animate-spin')} />
                {text && <div>{text}</div>}
            </div>
        </div>
    );
};
