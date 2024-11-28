
import clsx from 'clsx';
import React, { useState } from 'react';
import type { SelectProps } from 'rc-select';
import RCSelect from 'rc-select';
import 'rc-select/assets/index.css';
import './index.css';
import '../index.css';
import { CloseSvg } from 'components/icons';

const DownArrowSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M7.69598 10.044L7.69603 10.0441C7.77551 10.1196 7.88848 10.1663 8.01129 10.1663L7.69598 10.044ZM7.69598 10.044L3.96265 6.49572L3.9627 6.49566M7.69598 10.044L3.9627 6.49566M3.9627 6.49566L3.95631 6.4898M3.9627 6.49566L3.95631 6.4898M3.95631 6.4898C3.91593 6.45274 3.88523 6.40981 3.86465 6.36427C3.8441 6.31881 3.8337 6.27094 3.83327 6.22322C3.83283 6.1755 3.84235 6.12753 3.86201 6.08187C3.8817 6.03614 3.91152 5.99285 3.95108 5.95525C3.99069 5.9176 4.03919 5.88653 4.09437 5.86507C4.14959 5.8436 4.20956 5.83252 4.27057 5.83302C4.33157 5.83353 4.39127 5.8456 4.44597 5.86793C4.50064 5.89025 4.54843 5.92203 4.58722 5.9602L4.58717 5.96026M3.95631 6.4898L4.58717 5.96026M4.58717 5.96026L4.59346 5.96624M4.58717 5.96026L4.59346 5.96624M4.59346 5.96624L7.66693 8.88737L8.01139 9.21475M4.59346 5.96624L8.01139 9.21475M8.01139 9.21475L8.35584 8.88737M8.01139 9.21475L8.35584 8.88737M8.35584 8.88737L11.4256 5.96982C11.5056 5.89754 11.6171 5.85383 11.7372 5.85483C11.8587 5.85583 11.9701 5.90232 12.0488 5.97705C12.1266 6.05099 12.1657 6.14555 12.1666 6.23875C12.1674 6.33089 12.1308 6.42475 12.0564 6.4993L8.3268 10.044L8.32674 10.0441M8.35584 8.88737L8.32674 10.0441M8.32674 10.0441C8.24726 10.1196 8.1343 10.1663 8.01149 10.1663L8.32674 10.0441Z" fill="currentColor" stroke="currentColor" />
        </svg>
    );
};

const ClearButton = () => {
    return (
        <button
            type="button"
            className={clsx('inline-flex p-0.5 blue bg-gray-200 rounded')}
        >
            <CloseSvg />
        </button>
    );
};

export interface ISelectProps extends Omit<SelectProps, 'allowClear' | 'suffixIcon' | 'menuItemSelectedIcon' | 'dropdownClassName' | 'open' > {
    allowClear?: boolean;
}

function isEmptyValue(value: any) {
    return value === null || value === undefined || value === '';
}

export const Select = (props: ISelectProps) => {
    const { className, allowClear: _allowClear, value, ...restProps } = props;

    const allowClear = (!isEmptyValue(value) && _allowClear) ? { clearIcon: ClearButton } : false;

    const [open, setOpen] = useState(false);

    return (
        <RCSelect
            {...restProps}
            value={value}
            allowClear={allowClear}
            suffixIcon={(
                <span className={clsx('inline-flex text-gray-500  align-middle', {
                    'rotate-180 transition-transform': open,
                })}
                >
                    <DownArrowSvg />
                </span>
            )}
            menuItemSelectedIcon={null}
            className={clsx('bg-gray-50 text-gray-900 text-sm', className)}
            dropdownClassName="!border-0 shadow p-1 rounded-lg border border-solid border-gray-200 z-[999999]"
            open={open}
            onDropdownVisibleChange={setOpen}
        />
    );
};
