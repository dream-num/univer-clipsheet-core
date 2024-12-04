import React, { useCallback, useEffect, useState } from 'react';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import { ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';
import type { OpenSidePanelMessage, SetStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, getActiveTabId, throttle, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { t } from '@univer-clipsheet-core/locale';
import { SearchInput } from '@components/SearchInput';
import { Tooltip } from '@components/tooltip';
import { ColumnList } from './ColumnList';
import type { ColumnListItem } from './ColumnList';
import '@components/tailwind.css';

export interface IScraperDropdownMenuProps {
    children: React.ReactElement;
    value?: string[];
    options: IScraper[];
    onChange?: (ids: string[]) => void;
}

const CloseSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M11.1766 9.99996L15.5797 5.59686C15.6592 5.52012 15.7225 5.42832 15.7661 5.32683C15.8097 5.22534 15.8327 5.11618 15.8336 5.00573C15.8346 4.89527 15.8135 4.78573 15.7717 4.6835C15.7299 4.58126 15.6681 4.48838 15.59 4.41028C15.5119 4.33217 15.419 4.2704 15.3168 4.22857C15.2146 4.18675 15.105 4.1657 14.9946 4.16666C14.8841 4.16762 14.7749 4.19057 14.6735 4.23416C14.572 4.27776 14.4802 4.34113 14.4034 4.42059L10.0003 8.82369L5.59722 4.42059C5.44033 4.26905 5.2302 4.18521 5.01208 4.1871C4.79397 4.189 4.58532 4.27648 4.43109 4.43072C4.27685 4.58496 4.18936 4.7936 4.18747 5.01171C4.18557 5.22983 4.26942 5.43996 4.42095 5.59686L8.82406 9.99996L4.42095 14.4031C4.3415 14.4798 4.27813 14.5716 4.23453 14.6731C4.19093 14.7746 4.16798 14.8837 4.16702 14.9942C4.16606 15.1046 4.18711 15.2142 4.22894 15.3164C4.27077 15.4187 4.33254 15.5115 4.41064 15.5896C4.48875 15.6677 4.58163 15.7295 4.68386 15.7713C4.7861 15.8132 4.89564 15.8342 5.00609 15.8333C5.11655 15.8323 5.22571 15.8094 5.3272 15.7658C5.42869 15.7222 5.52048 15.6588 5.59722 15.5793L10.0003 11.1762L14.4034 15.5793C14.5603 15.7309 14.7705 15.8147 14.9886 15.8128C15.2067 15.8109 15.4153 15.7234 15.5696 15.5692C15.7238 15.415 15.8113 15.2063 15.8132 14.9882C15.8151 14.7701 15.7312 14.56 15.5797 14.4031L11.1766 9.99996Z" fill="currentColor" />
        </svg>
    );
};

export const ScraperDropdownMenu = (props: IScraperDropdownMenuProps) => {
    const { value, onChange, options, children } = props;
    const [inputValue, setInputValue] = useState('');
    const [visible, setVisible] = useState(false);

    const [filteredOptions, setFilteredOptions] = useState(options);
    const throttleFilterOptionsByInputValue = useCallback(throttle(200, (inputValue: string, innerOptions: IScraper[]) => {
        const lowerCaseInputValue = inputValue.toLowerCase();
        const newOptions = innerOptions.filter((item) => item.name.toLowerCase().includes(lowerCaseInputValue));
        setFilteredOptions(newOptions);
    }), []);

    useEffect(() => {
        throttleFilterOptionsByInputValue(inputValue, options);
    }, [inputValue, options]);

    const columns: ColumnListItem<IScraper>[] = [
        {
            columnClassName: 'inline-flex',
            header: (
                <input
                    className="cursor-pointer w-4 h-4"
                    type="checkbox"
                    checked={value?.length === options.length}
                    onChange={(evt) => {
                        if (evt.target.checked) {
                            onChange?.(options.map((item) => item.id));
                        } else {
                            onChange?.([]);
                        }
                    }}
                />
            ),
            render: (data) => (
                <input
                    className="cursor-pointer w-4 h-4"
                    type="checkbox"
                    checked={value?.includes(data.id)}
                    onChange={(evt) => {
                        if (!value) {
                            return;
                        }
                        if (evt.target.checked) {
                            onChange?.([...value, data.id]);
                        } else {
                            onChange?.(value.filter((id) => id !== data.id));
                        }
                    }}
                />
            ),
        },
        {
            columnClassName: 'px-4 grow',
            header: <div className="h-[50px] flex items-center text-xs font-semibold text-gray-500">{t('Name')}</div>,
            render: (record, index) => {
                return (
                    <div className="h-[60px] flex flex-col justify-center  ">
                        <div className="max-w-[470px] text-[#0E111E] text-sm text-ellipsis overflow-hidden whitespace-nowrap">
                            <span>{record.name}</span>
                        </div>
                        <div className="text-gray-400 mt-2 flex gap-2 items-center">
                            <button type="button" className="hover:underline" onClick={() => chrome.tabs.create({ url: record.url })}>{t('OriginalLink')}</button>
                            <span>
                                {record.columns.length}
                                {' '}
                                {t('Columns')}
                            </span>
                            {/* <ScraperGearSvg /> */}
                        </div>
                    </div>
                );
            },
        },
        {
            header: <span className="text-xs font-semibold text-gray-500">{ t('Details')}</span>,
            render: (data, index) => {
                return (
                    <button
                        onClick={() => {
                            const msg: SetStorageMessage = {
                                type: ClipsheetMessageTypeEnum.SetStorage,
                                payload: {
                                    key: ScraperStorageKeyEnum.CurrentScraper,
                                    value: { ...data },
                                },
                            };
                            chrome.runtime.sendMessage(msg);

                            getActiveTabId().then((tabId) => {
                                if (!tabId) {
                                    return;
                                }

                                const msg1: SetStorageMessage = {
                                    type: ClipsheetMessageTypeEnum.SetStorage,
                                    payload: {
                                        key: UIStorageKeyEnum.ScraperFormReadonly,
                                        value: true,
                                    },
                                };

                                const msg2: OpenSidePanelMessage = {
                                    type: ClipsheetMessageTypeEnum.OpenSidePanel,
                                    payload: tabId,
                                };
                                chrome.runtime.sendMessage(msg1);
                                chrome.runtime.sendMessage(msg2);
                            });
                        }}
                        type="button"
                        className="rounded-full px-2 h-6 flex items-center justify-center border-gray-200 hover:bg-gray-100 border border-solid "
                    >
                        {t('View')}
                    </button>
                );
            },
        },
    ];

    const overlay = (
        <div className="w-[600px]">
            <div className="text-gray-900 flex items-center justify-between">
                <SearchInput
                    wrapClassName="mr-2"
                    className="w-full "
                    value={inputValue}
                    onChange={(evt) => setInputValue(evt.target.value)}
                />
                <button type="button" className="inline-flex rounded hover:bg-gray-100" onClick={() => setVisible(false)}>
                    <CloseSvg />
                </button>
            </div>

            <div className="mt-2 bg-white">
                <ColumnList listClassName="overflow-y-auto max-h-[240px]" rowClassName="border-t border-t-solid border-t-gray-200 hover:bg-gray-50" headerClassName="!bg-white" className="!rounded-lg px-3 py-1" data={filteredOptions} columns={columns} />
            </div>
        </div>
    );

    return (
        <Tooltip showArrow={false} overlayClassName="white-tooltip space-tooltip-inner" placement="bottomRight" trigger="click" visible={visible} onVisibleChange={setVisible} overlay={overlay}>
            {children}
        </Tooltip>
    );
};
