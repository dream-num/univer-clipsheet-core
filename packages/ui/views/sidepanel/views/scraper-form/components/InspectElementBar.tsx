
import { generateRandomId } from '@univer-clipsheet-core/shared';
import { coverHelper, requestElementInspection, requestUpperElement } from '@views/client';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface IInspectElementBarProps {
    text: string;
    disabled?: boolean;
    className?: string;
    empty?: boolean;
    inspecting?: boolean;
    onUpperLevelClick?: () => void;
    onClick?: () => void;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

export const UpperLevelSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.76695 1.25762C7.36722 0.779361 6.63211 0.779358 6.23238 1.25762L4.20435 3.68406C3.6602 4.33512 4.12312 5.32537 4.97164 5.32537H5.25909V8.52405C5.25909 9.07633 5.7068 9.52405 6.25909 9.52405H7.74012C8.2924 9.52405 8.74012 9.07633 8.74012 8.52405V5.32537H9.02769C9.87621 5.32537 10.3391 4.33512 9.79498 3.68406L7.76695 1.25762ZM5.39946 4.12537L6.99966 2.21079L8.59987 4.12537H8.54012C7.98783 4.12537 7.54012 4.57308 7.54012 5.12537V8.32405H6.45909V5.12537C6.45909 4.57308 6.01137 4.12537 5.45909 4.12537H5.39946Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M4.07951 7.11286C4.3759 6.96467 4.49603 6.60426 4.34784 6.30788C4.19964 6.01149 3.83924 5.89136 3.54285 6.03955L0.354133 7.63391C0.150862 7.73554 0.0224609 7.9433 0.0224609 8.17057V11.1121C0.0224609 11.4908 0.236463 11.8371 0.575247 12.0065L6.55269 14.9952C6.83422 15.136 7.16559 15.136 7.44712 14.9952L13.4246 12.0065C13.7633 11.8371 13.9773 11.4908 13.9773 11.1121V8.17057C13.9773 7.9433 13.8489 7.73554 13.6457 7.63391L10.457 6.03955C10.1606 5.89136 9.80016 6.01149 9.65197 6.30788C9.50377 6.60426 9.62391 6.96467 9.92029 7.11286L12.0357 8.17057L6.9999 10.6885L1.9641 8.17057L4.07951 7.11286ZM7.44712 11.8065L12.7773 9.14139V10.9885L6.9999 13.8772L1.22246 10.9885V9.14139L6.55269 11.8065C6.83422 11.9473 7.16559 11.9473 7.44712 11.8065Z" fill="currentColor" />
        </svg>
    );
};

export const DragFrameSingleSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3.74063 1.14062C2.3046 1.14062 1.14051 2.30481 1.14063 3.74083L1.14131 12.2572C1.14143 13.6931 2.30545 14.857 3.74131 14.857H6.95517C7.28654 14.857 7.55517 14.5884 7.55517 14.257C7.55517 13.9256 7.28654 13.657 6.95517 13.657H3.74131C2.96816 13.657 2.34137 13.0303 2.34131 12.2571L2.34063 3.74074C2.34056 2.9675 2.96738 2.34063 3.74063 2.34063H12.2568C13.03 2.34063 13.6568 2.96743 13.6568 3.74063V7.30303C13.6568 7.6344 13.9255 7.90303 14.2568 7.90303C14.5882 7.90303 14.8568 7.6344 14.8568 7.30303V3.74063C14.8568 2.30469 13.6928 1.14062 12.2568 1.14062H3.74063Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M9.50674 8.80072C9.31003 8.76138 9.10666 8.82295 8.96481 8.96481C8.82295 9.10666 8.76138 9.31003 8.80072 9.50674L9.77428 14.3745C9.82187 14.6125 10.0081 14.7983 10.2462 14.8454C10.4843 14.8925 10.7272 14.7916 10.8619 14.5897L11.4294 13.7383L12.3722 14.6811C12.6066 14.9154 12.9865 14.9154 13.2208 14.6811L14.6811 13.2208C14.9154 12.9865 14.9154 12.6066 14.6811 12.3722L13.7383 11.4294L14.5897 10.8619C14.7916 10.7272 14.8925 10.4843 14.8454 10.2462C14.7983 10.0081 14.6125 9.82187 14.3745 9.77428L9.50674 8.80072ZM10.6669 12.7188L10.1539 10.1539L12.7188 10.6669L12.4637 10.837C12.3141 10.9367 12.2171 11.0982 12.1994 11.2771C12.1817 11.4559 12.2451 11.6333 12.3722 11.7604L13.4083 12.7965L12.7965 13.4083L11.7604 12.3722C11.6333 12.2451 11.4559 12.1817 11.2771 12.1994C11.0982 12.2171 10.9367 12.3141 10.837 12.4637L10.6669 12.7188Z" fill="currentColor" />
        </svg>
    );
};

export const InspectElementBar = (props: IInspectElementBarProps) => {
    const {
        disabled = false,
        text,
        empty,
        inspecting = false,
        className,
        onUpperLevelClick,
        onClick,
        onMouseEnter,
        onMouseLeave,
    } = props;
    const withDisabledCallback = (callback?: () => void) => {
        return () => {
            if (!disabled) {
                callback?.();
            }
        };
    };

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={clsx('flex items-center justify-between text-[#474D57]  text-sm p-1 rounded-md border border-solid border-[#E6E8EB]', {
                'text-gray-900': !empty,
                'text-gray-300': empty,
            }, className)}
        >
            <div className="flex items-center">
                {!empty && (
                    <button onClick={withDisabledCallback(onUpperLevelClick)} type="button" className="p-1 mr-1.5  inline-flex rounded-[4px] hover:bg-[rgba(46,106,248,0.06)]">
                        <UpperLevelSvg />
                    </button>
                )}
                <span>{text}</span>
            </div>
            <div
                className={clsx('rounded-[4px] hover:bg-[rgba(46,106,248,0.06)] inline-flex p-1 cursor-pointer', {
                    'text-[#274FEE] bg-[rgba(46,106,248,0.06)]': inspecting,
                })}
                onClick={withDisabledCallback(onClick)}
            >
                <DragFrameSingleSvg />
            </div>
        </div>
    );
};

export interface IScraperInspectElementBarProps extends Pick<IInspectElementBarProps, 'disabled' | 'text'> {
    selector: string;
    onChange?: (selector: {
        selector: string;
        lastOfSelector: string;
    }) => void;
    onUpperChange?: (selector: string) => void;
}

export const ScraperInspectElementBar = (props: IScraperInspectElementBarProps) => {
    const { selector, onChange, onUpperChange, ...restProps } = props;
    const [inspecting, setInspecting] = useState(false);
    const idRef = useRef(generateRandomId());
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        coverHelper.updateCover(idRef.current, selector);
    }, [selector]);

    const onMouseEnter = useCallback(() => {
        setHovering(true);
        if (selectorRef.current) {
            coverHelper.addCover(idRef.current, selectorRef.current);
        }
    }, []);

    const onMouseLeave = useCallback(() => {
        setHovering(false);
        coverHelper.removeCover(idRef.current);
    }, []);

    return (
        <InspectElementBar
            {...restProps}
            className={clsx({
                'border-blue-500': hovering,
            })}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            empty={!selector}
            inspecting={inspecting}
            onClick={() => {
                setInspecting(true);
                requestElementInspection()
                    .then((selector) => {
                        onChange?.(selector);
                    }).finally(() => {
                        setInspecting(false);
                    });
            }}
            onUpperLevelClick={() => {
                requestUpperElement(selector)
                    .then((upperSelector) => {
                        if (upperSelector) {
                            onUpperChange?.(upperSelector);
                        }
                    });
            }}
        />
    );
};

