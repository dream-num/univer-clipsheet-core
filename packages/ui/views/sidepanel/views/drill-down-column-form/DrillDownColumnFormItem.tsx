
import React, { useEffect, useState } from 'react';
// import { ScraperInput, Select } from '@chrome-extension-boilerplate/shared-client';

// import type { IDrillDownColumn } from '@chrome-extension-boilerplate/shared';
import { Option } from 'rc-select';
import clsx from 'clsx';
// import { t } from '../../locale';
import type { IDrillDownColumn } from '@univer-clipsheet-core/scraper';
import { ScraperInput } from '@components/ScraperInput';
import { t } from '@univer-clipsheet-core/locale';
import { Select } from '@components/select';
import { typeOptions } from '../../constants';

const InspectMouseSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3.74063 1.14062C2.3046 1.14062 1.14051 2.30481 1.14063 3.74083L1.14131 12.2572C1.14143 13.6931 2.30545 14.857 3.74131 14.857H6.95517C7.28654 14.857 7.55517 14.5884 7.55517 14.257C7.55517 13.9256 7.28654 13.657 6.95517 13.657H3.74131C2.96816 13.657 2.34137 13.0303 2.34131 12.2571L2.34063 3.74074C2.34056 2.9675 2.96738 2.34063 3.74063 2.34063H12.2568C13.03 2.34063 13.6568 2.96743 13.6568 3.74063V7.30303C13.6568 7.6344 13.9255 7.90303 14.2568 7.90303C14.5882 7.90303 14.8568 7.6344 14.8568 7.30303V3.74063C14.8568 2.30469 13.6928 1.14062 12.2568 1.14062H3.74063Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M9.50674 8.80072C9.31003 8.76138 9.10666 8.82295 8.96481 8.96481C8.82295 9.10666 8.76138 9.31003 8.80072 9.50674L9.77428 14.3745C9.82187 14.6125 10.0081 14.7983 10.2462 14.8454C10.4843 14.8925 10.7272 14.7916 10.8619 14.5897L11.4294 13.7383L12.3722 14.6811C12.6066 14.9154 12.9865 14.9154 13.2208 14.6811L14.6811 13.2208C14.9154 12.9865 14.9154 12.6066 14.6811 12.3722L13.7383 11.4294L14.5897 10.8619C14.7916 10.7272 14.8925 10.4843 14.8454 10.2462C14.7983 10.0081 14.6125 9.82187 14.3745 9.77428L9.50674 8.80072ZM10.6669 12.7188L10.1539 10.1539L12.7188 10.6669L12.4637 10.837C12.3141 10.9367 12.2171 11.0982 12.1994 11.2771C12.1817 11.4559 12.2451 11.6333 12.3722 11.7604L13.4083 12.7965L12.7965 13.4083L11.7604 12.3722C11.6333 12.2451 11.4559 12.1817 11.2771 12.1994C11.0982 12.2171 10.9367 12.3141 10.837 12.4637L10.6669 12.7188Z" fill="currentColor" />
        </svg>
    );
};

const UpperFloorSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M8.76695 1.25775C8.36722 0.779483 7.63211 0.77948 7.23238 1.25775L5.20435 3.68419C4.6602 4.33524 5.12312 5.32549 5.97164 5.32549H6.25909V8.52417C6.25909 9.07645 6.7068 9.52417 7.25909 9.52417H8.74012C9.2924 9.52417 9.74012 9.07645 9.74012 8.52417V5.32549H10.0277C10.8762 5.32549 11.3391 4.33524 10.795 3.68419L8.76695 1.25775ZM6.39946 4.12549L7.99966 2.21091L9.59987 4.12549H9.54012C8.98783 4.12549 8.54012 4.5732 8.54012 5.12549V8.32417H7.45909V5.12549C7.45909 4.5732 7.01137 4.12549 6.45909 4.12549H6.39946Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M5.07951 7.11298C5.3759 6.96479 5.49603 6.60439 5.34784 6.308C5.19964 6.01161 4.83924 5.89148 4.54285 6.03967L1.35413 7.63403C1.15086 7.73567 1.02246 7.94342 1.02246 8.17069V11.1122C1.02246 11.491 1.23646 11.8372 1.57525 12.0066L7.55269 14.9953C7.83422 15.1361 8.16559 15.1361 8.44712 14.9953L14.4246 12.0066C14.7633 11.8372 14.9773 11.491 14.9773 11.1122V8.17069C14.9773 7.94342 14.8489 7.73567 14.6457 7.63403L11.457 6.03967C11.1606 5.89148 10.8002 6.01161 10.652 6.308C10.5038 6.60439 10.6239 6.96479 10.9203 7.11298L13.0357 8.17069L7.9999 10.6886L2.9641 8.17069L5.07951 7.11298ZM8.44712 11.8066L13.7773 9.14151V10.9886L7.9999 13.8773L2.22246 10.9886V9.14151L7.55269 11.8066C7.83422 11.9474 8.16559 11.9474 8.44712 11.8066Z" fill="currentColor" />
        </svg>
    );
};

const TrashSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.3333 4.14039H10.6667V2.73688C10.6667 2.36465 10.5262 2.00766 10.2761 1.74445C10.0261 1.48124 9.68696 1.33337 9.33333 1.33337H6.66667C6.31305 1.33337 5.97391 1.48124 5.72386 1.74445C5.47381 2.00766 5.33333 2.36465 5.33333 2.73688V4.14039H2.66667C2.48986 4.14039 2.32029 4.21433 2.19526 4.34593C2.07024 4.47754 2 4.65603 2 4.84215C2 5.02826 2.07024 5.20676 2.19526 5.33836C2.32029 5.46997 2.48986 5.5439 2.66667 5.5439H3.33333V13.2632C3.33333 13.6354 3.47381 13.9924 3.72386 14.2556C3.97391 14.5188 4.31304 14.6667 4.66667 14.6667H11.3333C11.687 14.6667 12.0261 14.5188 12.2761 14.2556C12.5262 13.9924 12.6667 13.6354 12.6667 13.2632V5.5439H13.3333C13.5101 5.5439 13.6797 5.46997 13.8047 5.33836C13.9298 5.20676 14 5.02826 14 4.84215C14 4.65603 13.9298 4.47754 13.8047 4.34593C13.6797 4.21433 13.5101 4.14039 13.3333 4.14039ZM6.66667 2.73688H9.33333V4.14039H6.66667V2.73688ZM11.3333 13.2632H4.66667V5.5439H11.3333V13.2632Z" fill="currentColor" />
            <path d="M6.66667 6.24565C6.48986 6.24565 6.32029 6.31959 6.19526 6.45119C6.07024 6.5828 6 6.76129 6 6.94741V11.8597C6 12.0458 6.07024 12.2243 6.19526 12.3559C6.32029 12.4875 6.48986 12.5614 6.66667 12.5614C6.84348 12.5614 7.01305 12.4875 7.13807 12.3559C7.2631 12.2243 7.33333 12.0458 7.33333 11.8597V6.94741C7.33333 6.76129 7.2631 6.5828 7.13807 6.45119C7.01305 6.31959 6.84348 6.24565 6.66667 6.24565Z" fill="currentColor" />
            <path d="M9.33333 6.24565C9.15652 6.24565 8.98695 6.31959 8.86193 6.45119C8.73691 6.5828 8.66667 6.76129 8.66667 6.94741V11.8597C8.66667 12.0458 8.73691 12.2243 8.86193 12.3559C8.98695 12.4875 9.15652 12.5614 9.33333 12.5614C9.51014 12.5614 9.67971 12.4875 9.80474 12.3559C9.92976 12.2243 10 12.0458 10 11.8597V6.94741C10 6.76129 9.92976 6.5828 9.80474 6.45119C9.67971 6.31959 9.51014 6.24565 9.33333 6.24565Z" fill="currentColor" />
        </svg>
    );
};

export interface IDrillDownColumnFormProps {
    data: IDrillDownColumn;
    deletable?: boolean;
    border?: boolean;
    inspecting: boolean;
    disabled?: {
        name?: boolean;
    };
    onChange?: <K extends keyof IDrillDownColumn = keyof IDrillDownColumn >(key: K, value: IDrillDownColumn[K]) => void;
    onInspectClick?: () => void;
    onDelete?: () => void;
    onUpperClick?: () => void;
}

export const DrillDownColumnFormItem = (props: IDrillDownColumnFormProps) => {
    const { inspecting, data, disabled, onInspectClick, onUpperClick, deletable, onChange, onDelete, border = false } = props;
    const [name, setName] = useState(data.name);
    useEffect(() => {
        setName(data.name);
    }, [data.name]);

    return (
        <div className={clsx('flex flex-col gap-2 p-3  rounded-lg', {
            'border border-solid border-gray-200': border,
        })}
        >
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-800 text-sm">{t('FieldName')}</span>
                    {deletable && (
                        <button onClick={onDelete} type="button" className="inline-flex text-red-500 p-1 rounded-md hover:bg-[#FDE8E8]"><TrashSvg /></button>
                    )}
                </div>
                <ScraperInput
                    disabled={disabled?.name}
                    value={name}
                    onChange={(v) => {
                        setName(v);
                    }}
                    onBlur={() => {
                        onChange?.('name', name);
                    }}
                    closable
                />
            </div>
            <div>
                <div className="mb-2 text-gray-800 text-sm">{t('Selector')}</div>
                <div className="flex items-center">
                    <button
                        type="button"
                        className={clsx('h-6 px-1.5 inline-flex items-center text-xs rounded-md', {
                            'text-indigo-600 bg-white border border-solid border-indigo-600': !inspecting,
                            'text-white bg-indigo-600': inspecting,
                        })}
                        onClick={() => {
                            if (!inspecting) {
                                onInspectClick?.();
                            }
                        }}
                    >
                        <InspectMouseSvg />
                        <span className="ml-1">{t('Reselect')}</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!inspecting) {
                                onUpperClick?.();
                            }
                        }}
                        type="button"
                        className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-500"
                    >
                        <UpperFloorSvg />
                    </button>
                </div>
            </div>
            <div>
                <div className=" mb-2 text-gray-800 text-sm">{t('Type')}</div>
                <Select
                    className="!w-full"
                    value={data.type}

                    onChange={(v: any) => {
                        onChange?.('type', v);
                    }}
                >
                    {typeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                </Select>
            </div>

        </div>
    );
};
