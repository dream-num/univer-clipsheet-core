import type { FC } from 'react';
import React, { useMemo } from 'react';
import clsx from 'clsx';

const Icon: FC<{ className?: string; filename: string; onClick?: React.MouseEventHandler<HTMLImageElement> }> = (props) => {
    const { className, filename, onClick } = props;
    const sourceUrl = useMemo(() => chrome.runtime.getURL(`/popup/${filename}`), [filename]);

    return (
        <img onClick={onClick} className={className} src={sourceUrl} />
    );
};

function iconFactory(factoryProps: { className?: string; filename: string }) {
    const { filename } = factoryProps;

    return (props: {
        className?: string;
        onClick?: React.MouseEventHandler<HTMLImageElement>;
    }) => {
        return <Icon onClick={props.onClick} className={clsx(factoryProps.className, props.className)} filename={filename}></Icon>;
    };
}

const AddSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <g clipPath="url(#clip0_2617_10082)">
                <path d="M10.0007 5.91699C10.4149 5.91699 10.7507 6.25278 10.7507 6.66699V9.25012H13.3337C13.7479 9.25012 14.0837 9.58591 14.0837 10.0001C14.0837 10.4143 13.7479 10.7501 13.3337 10.7501H10.7507V13.3337C10.7507 13.7479 10.4149 14.0837 10.0007 14.0837C9.58652 14.0837 9.25073 13.7479 9.25073 13.3337V10.7501H6.66699C6.25278 10.7501 5.91699 10.4143 5.91699 10.0001C5.91699 9.58591 6.25278 9.25012 6.66699 9.25012H9.25073V6.66699C9.25073 6.25278 9.58652 5.91699 10.0007 5.91699Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M0.916992 10.0003C0.916992 4.98374 4.98374 0.916992 10.0003 0.916992C15.0169 0.916992 19.0837 4.98374 19.0837 10.0003C19.0837 15.0169 15.0169 19.0837 10.0003 19.0837C4.98374 19.0837 0.916992 15.0169 0.916992 10.0003ZM10.0003 2.41699C5.81216 2.41699 2.41699 5.81216 2.41699 10.0003C2.41699 14.1885 5.81216 17.5837 10.0003 17.5837C14.1885 17.5837 17.5837 14.1885 17.5837 10.0003C17.5837 5.81216 14.1885 2.41699 10.0003 2.41699Z" fill="currentColor" />
            </g>
            <defs>
                <clipPath id="clip0_2617_10082">
                    <rect width="20" height="20" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};
function svgIconFactory(factoryProps: { icon: React.ReactNode }) {
    const { icon } = factoryProps;
    return (props: {
        className?: string;
        onClick?: React.MouseEventHandler<HTMLSpanElement>;
    }) => {
        const { className, onClick } = props;
        return (
            <span onClick={onClick} className={clsx('inline-flex', className)}>
                {icon}
            </span>
        );
    };
}

export const AddIcon = svgIconFactory({
    icon: <AddSvg />,
});

export const CloseIcon = iconFactory({
    className: 'w-[14px] h-[14px]',
    filename: 'close-icon.svg',
});
