import React, { useCallback } from 'react';
import clsx from 'clsx';
import './index.css';

const InputNumberArrowSvg = (props: {
    className?: string;
}) => {
    const { className } = props;
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="6" height="4" viewBox="0 0 6 4" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M5.76345 3.49981C5.57306 3.69018 5.26439 3.69017 5.07402 3.49978L3.15866 1.58423C3.07079 1.49636 2.92832 1.49635 2.84045 1.58422L0.924916 3.49976C0.734535 3.69014 0.425867 3.69014 0.235487 3.49976C0.0451059 3.30938 0.0451059 3.00071 0.235487 2.81033L2.46924 0.576583C2.76214 0.28368 3.23703 0.283692 3.52992 0.576609L5.76348 2.81038C5.95385 3.00077 5.95384 3.30944 5.76345 3.49981Z" fill="currentColor" />
        </svg>
    );
};

function isUndefined(value: any): value is undefined {
    return value === undefined;
}
export interface IInputNumberProps {
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    value: number | undefined;
    onChange?: (value: number | undefined) => void;
}

export const InputNumber = (props: IInputNumberProps) => {
    const { value, onChange: _onChange, min, max, step = 1, disabled = false } = props;

    const onChange = useCallback((num: number | undefined) => {
        if (disabled) {
            return;
        }

        _onChange?.(num);
    }, [disabled, _onChange]);

    const onChangeWithLimit = useCallback((num: number | undefined) => {
        if (!isUndefined(num)) {
            if (!isUndefined(min) && num < min) {
                onChange(min);
                return;
            }

            if (!isUndefined(max) && num > max) {
                onChange(max);
                return;
            }
        }

        onChange(num);
    }, [onChange, min, max]);

    const textColor = disabled ? 'text-[rgba(15,23,42,0.20)] cursor-auto' : 'text-[#0F172A]';

    return (
        <div className="flex w-20 h-[30px] outline-[#E5E5E5] outline-1 outline rounded-md">
            <div className="flex flex-col">
                <input
                    disabled={disabled}
                    value={value === undefined ? '' : value}
                    onInput={({ target }) => {
                        const inputValue = (target as HTMLInputElement).value;
                        onChange(inputValue === '' ? undefined : Number(inputValue));
                    }}
                    onBlur={() => {
                        onChangeWithLimit(value);
                    }}
                    className={clsx('grow w-full border-none outline-0 text-xs text-center  focus-visible:outline-blue-500', textColor)}
                    type="number"
                />
            </div>
            <div className=" border-l border-solid border-[#E5E5E5] flex flex-col">
                <button
                    className={clsx('flex justify-center items-center w-[18px] grow bg-white border-none hover:bg-gray-100', textColor, {
                        'cursor-pointer': !disabled,
                    })}
                    onClick={() => onChangeWithLimit((value ?? 0) + step)}
                >
                    <InputNumberArrowSvg />
                </button>
                <button
                    className={clsx('flex justify-center items-center w-[18px] grow bg-white border-none hover:bg-gray-100', textColor, {
                        'cursor-pointer': !disabled,
                    })}
                    onClick={() => onChangeWithLimit((value ?? 0) - step)}
                >
                    <InputNumberArrowSvg className="rotate-180" />
                </button>
            </div>
        </div>
    );
};
