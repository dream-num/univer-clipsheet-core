import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { useCallback, useRef } from 'react';

export interface UploadProps {
    className?: string;
    accept?: string;
    onFileChange?: (file: File) => void;
}

export function readFileContent(file: File, encoding = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file, encoding);
    });
}

export const Upload = (props: PropsWithChildren<UploadProps>) => {
    const { className, children, accept, onFileChange } = props;

    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileChange?.(file);
        }
    }, [onFileChange]);

    return (
        <div className={clsx('inline-block', className)} onClick={() => inputRef.current?.click()}>
            {children}
            <input ref={inputRef} className="w-0 h-0" type="file" accept={accept} onChange={handleFileChange} />
        </div>
    );
};
