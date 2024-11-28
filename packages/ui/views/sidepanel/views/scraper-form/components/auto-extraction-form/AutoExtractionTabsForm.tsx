import React from 'react';
import clsx from 'clsx';

interface IAutoExtractionTabsProps {
    tabs: Array<{ text: string; key: string | number; component: React.ReactNode }>;
    activeTab: string | number;
    onTabChange?: (tab: AutoExtractionFormTab) => void;
}

export interface IAutoExtractionFormTabsProps extends IAutoExtractionTabsProps {
}
export type AutoExtractionFormTab = IAutoExtractionFormTabsProps['tabs'][number];

const AutoExtractionTabs = (props: IAutoExtractionTabsProps) => {
    const { tabs, activeTab, onTabChange } = props;

    return (
        <div className="p-[2px] bg-[#F1F2F5] flex justify-content rounded-md">
            {tabs.map((tab) => (
                <div
                    onClick={() => onTabChange?.(tab)}
                    key={tab.key}
                    className={clsx('text-nowrap text-center p-1 px-1.5 grow rounded-md text-[#0F172A] text-[11px] leading-[150%] cursor-pointer', {
                        'bg-white shadow-[0_2px_8px_0_rgba(15,23,42,0.06)]': activeTab === tab.key,
                        'bg-transparent': activeTab !== tab.key,
                    })}
                >
                    {tab.text}
                </div>
            ))}
        </div>
    );
};

export const AutoExtractionTabsForm = (props: IAutoExtractionFormTabsProps) => {
    const { tabs, activeTab, onTabChange } = props;

    const currentTab = tabs.find((tab) => tab.key === activeTab);
    return (
        <div>
            <AutoExtractionTabs activeTab={activeTab} tabs={tabs} onTabChange={onTabChange}></AutoExtractionTabs>
            {currentTab?.component && (
                <div className="mt-2 p-3 rounded-lg border border-[#E6E8EB] border-solid">
                    {currentTab.component}
                </div>
            )}
        </div>
    );
};

