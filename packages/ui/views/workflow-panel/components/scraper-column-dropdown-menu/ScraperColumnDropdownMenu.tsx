// import type { IScraper, IWorkflowSourceColumn } from '@chrome-extension-boilerplate/shared';
import Tooltip from 'rc-tooltip';
import React, { useState } from 'react';
// import { CollapseIconSvg, ExpandIconSvg } from '@chrome-extension-boilerplate/shared-client';
import 'rc-tooltip/assets/bootstrap.css';
import './index.css';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import type { IWorkflowSourceColumn } from '@univer-clipsheet-core/workflow';
import { CollapseIconSvg, ExpandIconSvg } from '@components/icons';

export interface IScraperColumnDropdownMenuProps {
    children: React.ReactElement;
    options: IScraper[];
    value?: IWorkflowSourceColumn[];
    onChange?: (checked: boolean, scraperId: string, columnId: string) => void;
}

export const ScraperColumnDropdownMenu = (props: IScraperColumnDropdownMenuProps) => {
    const { value, children, options, onChange } = props;
    const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

    const overlay = (
        <div className=" bg-white max-h-[240px] overflow-y-auto">
            {options.map((option) => {
                return (
                    <div key={option.id} className="text-sm">
                        <div className="flex items-center p-2">
                            <button
                                className="mr-2"
                                type="button"
                                onClick={() => {
                                    if (collapsedIds.includes(option.id)) {
                                        setCollapsedIds(collapsedIds.filter((id) => id !== option.id));
                                    } else {
                                        setCollapsedIds([...collapsedIds, option.id]);
                                    }
                                }}
                            >
                                {collapsedIds.includes(option.id) ? <ExpandIconSvg /> : <CollapseIconSvg />}
                            </button>
                            <span>{option.name}</span>
                        </div>
                        {!collapsedIds.includes(option.id) && (
                            <ul className="flex flex-col gap-2">
                                {option.columns.map((column) => {
                                    const checked = value && (value.findIndex((c) => c.columnId === column.id) >= 0);
                                    return (
                                        <li className="flex items-center pl-6" key={column.id}>
                                            <input
                                                onChange={(evt) => {
                                                    onChange?.(evt.target.checked, option.id, column.id);
                                                }}
                                                className="cursor-pointer mr-2 w-4 h-4"
                                                type="checkbox"
                                                checked={checked}
                                            />
                                            <span onClick={() => onChange?.(!checked, option.id, column.id)} className="w-[90px] cursor-pointer text-gray-500  whitespace-nowrap text-ellipsis overflow-hidden">{column.name}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            })}

        </div>
    );

    return <Tooltip trigger="click" placement="bottomLeft" overlayClassName="white-tooltip scraper-column-dropdown-menu-tooltip" overlay={overlay}>{children}</Tooltip>;
};
