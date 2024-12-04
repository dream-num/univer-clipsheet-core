import React from 'react';
import clsx from 'clsx';
import './tailwind.css';

const SearchSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7.65007 13.05C6.58203 13.05 5.53799 12.7333 4.64995 12.1399C3.76192 11.5466 3.06978 10.7032 2.66106 9.71649C2.25234 8.72977 2.1454 7.64401 2.35376 6.59651C2.56213 5.54902 3.07643 4.58683 3.83164 3.83162C4.58686 3.07642 5.54906 2.56212 6.59657 2.35376C7.64408 2.1454 8.72985 2.25234 9.71658 2.66105C10.7033 3.06977 11.5467 3.7619 12.1401 4.64992C12.7334 5.53795 13.0501 6.58198 13.0501 7.65C13.0485 9.08167 12.4791 10.4543 11.4667 11.4666C10.4544 12.4789 9.08176 13.0484 7.65007 13.05ZM7.65007 3.6C6.84904 3.6 6.06601 3.83753 5.39998 4.28255C4.73395 4.72757 4.21485 5.36009 3.90831 6.10013C3.60177 6.84017 3.52157 7.65449 3.67784 8.44011C3.83411 9.22574 4.21984 9.94738 4.78625 10.5138C5.35266 11.0802 6.07431 11.4659 6.85994 11.6222C7.64557 11.7784 8.4599 11.6982 9.19995 11.3917C9.94 11.0852 10.5725 10.5661 11.0176 9.90006C11.4626 9.23404 11.7001 8.45101 11.7001 7.65C11.699 6.5762 11.272 5.54669 10.5127 4.7874C9.7534 4.02811 8.72388 3.60107 7.65007 3.6Z" fill="currentColor" />
            <path d="M15.0751 15.75C14.8961 15.75 14.7245 15.6788 14.5979 15.5522L11.8979 12.8522C11.7749 12.7249 11.7069 12.5544 11.7084 12.3774C11.71 12.2004 11.7809 12.0311 11.9061 11.906C12.0312 11.7808 12.2005 11.7099 12.3775 11.7083C12.5545 11.7068 12.725 11.7748 12.8523 11.8978L15.5524 14.5978C15.6467 14.6922 15.711 14.8124 15.737 14.9434C15.7631 15.0743 15.7497 15.21 15.6986 15.3333C15.6475 15.4566 15.5611 15.562 15.4501 15.6362C15.3391 15.7104 15.2086 15.75 15.0751 15.75Z" fill="currentColor" />
        </svg>
    );
};

type NativeInputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export type SearchInputProps = Omit<NativeInputProps, 'type' | 'onFocus' | 'onBlur' > & {
    wrapClassName?: string;
};

export const SearchInput = (props: SearchInputProps) => {
    const { className, wrapClassName, ...restProps } = props;
    const [focused, setFocused] = React.useState(false);

    return (
        <div className={clsx('text-sm w-full inline-flex align-center px-2.5 py-1.5 rounded-lg border border-solid  bg-gray-50 outline-none', wrapClassName, {
            'border-gray-200': !focused,
            'border-indigo-600': focused,
        })}
        >
            <span className="mr-2">
                <SearchSvg />
            </span>
            <input {...restProps} className={clsx(className, 'bg-transparent outline-none')} type="text" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        </div>
    );
};
