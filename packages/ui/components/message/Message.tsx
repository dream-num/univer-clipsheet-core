
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './index.css';
import '../tailwind.css';
import clsx from 'clsx';
import { ErrorSingleSvg, SuccessSingleSvg } from '../icons';

export interface IShowMessageOption {
    type: 'success' | 'error';
    text: string;
    duration?: number;
    onClose?: () => void;
}

export interface IMessageRef {
    showMessage(option: IShowMessageOption): void;
}

export interface IMessageProps {
    className?: string;
}

export const Message = forwardRef<IMessageRef, IMessageProps>((props, ref) => {
    const { className } = props;
    const [icon, setIcon] = useState<React.ReactNode | null>(null);
    const [text, setText] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const elRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef<() => void>();
    const animationHide = useCallback(() => {
        elRef.current?.classList.add('out');

        setTimeout(() => {
            onCloseRef.current?.();

            setVisible(false);
        }, 300);
    }, []);

    useImperativeHandle(ref, () => ({
        showMessage(option) {
            const { type, text, duration = 3000 } = option;
            setIcon(type === 'success' ? <SuccessSingleSvg /> : <ErrorSingleSvg />);
            setText(text);
            setVisible(true);
            setTimeout(animationHide, duration);
            onCloseRef.current = option.onClose;
        },
    }));

    useEffect(() => {
        if (!visible) {
            elRef.current?.classList.remove('out');
        }
    }, [visible]);

    if (!visible) {
        return null;
    }
    return (
        <div ref={elRef} className={clsx('cs-message fixed  left-[50%] top-5 translate-x-[-50%] flex px-3 py-2 bg-white rounded-lg shadow-[0px_4px_24px_2px_rgba(30,_34,_43,_0.10)]', className)}>
            <div className="mr-[6px] flex-shrink-0">
                {icon}
            </div>
            <div className="text-[#1E222B] text-sm">{text}</div>
        </div>
    );
});
