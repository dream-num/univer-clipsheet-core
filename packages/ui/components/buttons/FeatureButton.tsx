
import React from 'react';
import clsx from 'clsx';

const featureButtonBackground = 'bg-[linear-gradient(90deg,_#5357ED_0%,_#40B9FF_104.41%)]';

export const FeatureButton = (props: Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'type'>) => {
    const { className, children, ...restProps } = props;

    return (
        <button
            {...restProps}
            type="button"
            className={clsx(
                featureButtonBackground,
                'h-[32px] inline-flex justify-center items-center rounded-[32px] text-sm font-semibold text-white',
                className)}
        >
            {children}
        </button>
    );
};
