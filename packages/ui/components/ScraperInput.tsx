import React, { forwardRef, memo, useCallback, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { CloseSvg } from './icons';

export interface ScraperInputProps extends Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'ref' | 'onChange'> {
    closable?: boolean;
    wrapClassName?: string;
    closeIconClassName?: string;
    onChange?: (inputValue: string) => void;
};

const InnerScraperInput = forwardRef<HTMLInputElement, ScraperInputProps>((props, ref) => {
    const {
        wrapClassName,
        closeIconClassName,
        className,
        closable,
        disabled = false,
        onChange: _onChange,
        onBlur: _onBlur,
        onFocus: _onFocus,
        ...restProps } = props;

    const [focused, setFocused] = React.useState(false);

    const onChange = useCallback((inputValue: string) => {
        _onChange?.(inputValue);
    }, [_onChange]);

    const onBlur = useCallback((evt: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        _onBlur?.(evt);
    }, [_onBlur]);

    const onFocus = useCallback((evt: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        _onFocus?.(evt);
    }, [_onFocus]);

    const inputRef = React.useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    return (
        <div className={clsx('w-full relative inline-flex', wrapClassName)}>
            <input
                {...restProps}
                ref={inputRef}
                disabled={disabled}
                onChange={(evt) => {
                    onChange(evt.currentTarget.value);
                }}
                onFocus={onFocus}
                onBlur={onBlur}
                className={clsx('w-full text-sm py-[6px] bg-gray-50 border border-solid border-gray-200 rounded-lg', {
                    'outline-1 outline-blue-500': focused,
                    'text-gray-900': !disabled,
                    'text-gray-500': disabled,
                    'px-2': !closable,
                    'pl-2 pr-[22px]': closable,
                }, className)}
            />
            {(closable && !disabled) && (
                <button
                    onClick={() => {
                        onChange('');
                        setTimeout(() => {
                            inputRef.current?.focus();
                        });
                    }}
                    type="button"
                    className={clsx('inline-flex p-1 absolute right-1.5 top-1/2 -translate-y-1/2 hover:bg-gray-200 rounded', closeIconClassName)}
                >
                    <CloseSvg />
                </button>
            )}
        </div>
    );
});

export const ScraperInput = memo(InnerScraperInput);

