import React, { useCallback } from 'react';
import clsx from 'clsx';
import { CloseSvg } from './icons';
import './tailwind.css';

export interface ScraperTextareaProps extends Omit<React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>, 'onChange'> {
    closable?: boolean;
    onChange?: (inputValue: string) => void;
};

export const ScraperTextarea = (props: ScraperTextareaProps) => {
    const {
        className,
        disabled = false,
        closable,
        onChange: _onChange,
        onBlur: _onBlur,
        onFocus: _onFocus,
        ...restProps
    } = props;
    const onChange = useCallback((inputValue: string) => {
        _onChange?.(inputValue);
    }, [_onChange]);

    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const [focused, setFocused] = React.useState(false);
    const onBlur = useCallback((evt: React.FocusEvent<HTMLTextAreaElement>) => {
        setFocused(false);
        _onBlur?.(evt);
    }, [_onBlur]);

    const onFocus = useCallback((evt: React.FocusEvent<HTMLTextAreaElement>) => {
        setFocused(true);
        _onFocus?.(evt);
    }, [_onFocus]);

    return (
        <div className="w-full relative inline-flex">
            <textarea
                {...restProps}
                onBlur={onBlur}
                onFocus={onFocus}
                disabled={disabled}
                onChange={(evt) => onChange(evt.target.value)}
                className={clsx(' resize-none w-full text-sm  py-1.5 bg-gray-50 border border-solid border-gray-200 rounded-lg', {
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
                    className="inline-flex p-1 absolute right-1.5 top-[5.5px] hover:bg-gray-200 rounded"
                >
                    <CloseSvg />
                </button>
            )}
        </div>
    );
};

