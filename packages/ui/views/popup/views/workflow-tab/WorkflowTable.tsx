import type {
    IGetWorkflowListParams,
    IWorkflow,
    RunWorkflowMessage,
    StopWorkflowMessage,
    // Message
} from '@univer-clipsheet-core/workflow';
import {
    minuteOptions,
    // DataSourceKeys,
    // defaultPageSize,
    // minuteOptions,
    // MsgType,
    // StorageKeys,
    TimerRepeatMode,
    WorkflowDataSourceKeyEnum,
    WorkflowMessageTypeEnum,
    WorkflowStorageKeyEnum } from '@univer-clipsheet-core/workflow';
import type { TableProps } from 'rc-table';
import React, { useEffect, useMemo } from 'react';
import { Table } from '@components/Table';
import type { DropdownMenuItem } from '@components/DropdownMenu';
import { DropdownMenu } from '@components/DropdownMenu';
// import {  separateLineMenu, useDataSource, useStorageValue } from '@univer-clipsheet-core/shared-client';

import { RunButton } from '@components/buttons';
import { MoreButton } from '@components/MoreButton';
import { usePopupContext } from '@views/popup/context';
import { t } from '@univer-clipsheet-core/locale';
import { TableLoading } from '@components/TableLoading';
import { separateLineMenu } from '@components/PopupMenus';
import { useDataSource, useImmediateDataSource, useStorageValue } from '@lib/hooks';
import { defaultPageSize } from '@univer-clipsheet-core/shared';
import { openWorkflowDialog } from './helper';

const WorkflowTableEmptySvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="240" height="121" viewBox="0 0 240 121" fill="none">
            <g clipPath="url(#clip0_161_9074)">
                <path opacity="0.302" d="M24.5555 94.1788C33.9252 92.656 37.7183 91.5103 46.8658 82.6144C56.0134 73.7185 65.289 86.6978 79.0463 81.4861C92.8036 76.2754 94.0609 69.966 115.103 89.2925C124.803 97.5063 132.517 94.2544 137.271 97.5063C140.44 99.6734 143.496 105.018 146.436 113.537H24.5555C14.8521 110.129 10 107.298 10 105.045C10 101.666 15.1867 95.7006 24.5555 94.1788Z" fill="url(#paint0_linear_161_9074)" />
                <path opacity="0.302" d="M135.688 107.769C142.938 106.643 145.872 105.797 152.951 99.2212C160.03 92.6454 167.207 102.239 177.853 98.387C188.498 94.5359 189.472 89.8727 205.754 104.157C213.259 110.228 219.229 107.825 222.907 110.228C225.36 111.83 227.725 115.78 230 122.077H135.688C128.178 119.558 124.424 117.466 124.424 115.801C124.424 113.303 128.437 108.893 135.688 107.769Z" fill="url(#paint1_linear_161_9074)" />
                <path d="M74.2812 24.8235C74.2812 19.2142 78.8472 14.667 84.4796 14.667H114.748C120.381 14.667 124.947 19.2142 124.947 24.8235V25.6604H144.543C152.527 25.6604 158.999 32.1061 158.999 40.0573V50.3591C158.999 58.3103 152.527 64.756 144.543 64.756H95.4549C92.174 64.756 89.5144 67.4048 89.5144 70.6722V80.7145C89.5144 83.982 92.174 86.6307 95.4549 86.6307H115.055V85.7926C115.055 80.1833 119.621 75.6361 125.253 75.6361H155.522C161.154 75.6361 165.72 80.1833 165.72 85.7926V95.9492C165.72 101.558 161.154 106.106 155.522 106.106H125.253C119.621 106.106 115.055 101.558 115.055 95.9492V95.1114H95.4549C87.471 95.1114 80.9988 88.6657 80.9988 80.7145V70.6722C80.9988 62.721 87.471 56.2753 95.4549 56.2753H144.543C147.824 56.2753 150.484 53.6265 150.484 50.3591V40.0573C150.484 36.7899 147.824 34.1411 144.543 34.1411H124.947V34.9801C124.947 40.5894 120.381 45.1366 114.748 45.1366H84.4796C78.8472 45.1366 74.2812 40.5894 74.2812 34.9801V24.8235Z" fill="url(#paint2_linear_161_9074)" />
                <g filter="url(#filter0_i_161_9074)">
                    <rect x="123.402" y="83.5552" width="33.3488" height="14.4995" rx="4" fill="white" />
                </g>
                <g filter="url(#filter1_i_161_9074)">
                    <rect x="82.8105" y="22.3765" width="33.3488" height="14.4995" rx="4" fill="white" />
                </g>
            </g>
            <defs>
                <filter id="filter0_i_161_9074" x="123.402" y="83.5552" width="33.3496" height="18.4995" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2.25" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.105882 0 0 0 0 0.254902 0 0 0 0 1 0 0 0 0.1 0" />
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_161_9074" />
                </filter>
                <filter id="filter1_i_161_9074" x="82.8105" y="22.3765" width="33.3496" height="18.4995" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2.25" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.105882 0 0 0 0 0.254902 0 0 0 0 1 0 0 0 0.1 0" />
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_161_9074" />
                </filter>
                <linearGradient id="paint0_linear_161_9074" x1="78" y1="85.5" x2="78.2177" y2="113.537" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#D8DEFF" />
                    <stop offset="1" stopColor="#F1F1FF" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint1_linear_161_9074" x1="177" y1="103.5" x2="177.212" y2="122.077" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E3E7FF" />
                    <stop offset="1" stopColor="#F0F4FF" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint2_linear_161_9074" x1="120.001" y1="14.667" x2="120.001" y2="106.106" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#AFC1FF" />
                    <stop offset="0.475" stopColor="#DFE3FF" />
                    <stop offset="1" stopColor="#AFC1FF" />
                </linearGradient>
                <clipPath id="clip0_161_9074">
                    <rect width="240" height="120" fill="white" transform="translate(0 0.5)" />
                </clipPath>
            </defs>
        </svg>
    );
};

const WorkflowTableEmpty = (props: {
    onClick?: () => void;
}) => {
    const { onClick } = props;
    return (
        <div className="h-full flex justify-center items-center">
            <div>
                <WorkflowTableEmptySvg />
                <div className="text-sm font-medium mt-2">
                    <span>{t('WorkflowEmptyText')}</span>
                    <button onClick={onClick} type="button" className="text-[#2C53F1] cursor-pointer">{t('WorkflowEmptyAction')}</button>
                </div>
            </div>
        </div>
    );
};

enum EditMenuKey {
    Edit = 'edit',
    Delete = 'delete',
}

const scheduleModeTextMap = {
    [TimerRepeatMode.Once]: t('Once'),
    [TimerRepeatMode.Daily]: t('Daily'),
    [TimerRepeatMode.Weekly]: t('Weekly'),
    [TimerRepeatMode.Monthly]: t('Monthly'),
    [TimerRepeatMode.Yearly]: t('Yearly'),
    [TimerRepeatMode.Weekday]: t('PerWeekday'),
    [TimerRepeatMode.Custom]: t('Custom'),
} as const;

const WorkflowScheduleText = (props: { schedule: NonNullable<IWorkflow['schedule']> }) => {
    const { schedule } = props;
    const minute = minuteOptions.find((item) => item.value === schedule.minute);

    const showMinute = TimerRepeatMode.Custom !== schedule.repeatMode;
    const scheduleText = scheduleModeTextMap[schedule.repeatMode];

    return (
        <div className="mt-2 flex gap-2 items-center">
            <span>
                <span>{scheduleText}</span>
                <span className="ml-1">{showMinute && minute?.label}</span>
                <span className="ml-1">{t('trigger')}</span>
            </span>
        </div>
    );
};

export const WorkflowTable = () => {
    const { searchInput } = usePopupContext();

    const { state: innerData = [], getState: getInnerData, loading } = useDataSource<IWorkflow[], IGetWorkflowListParams>(WorkflowDataSourceKeyEnum.WorkflowList);
    const { state: runningWorkflowIds = [] } = useImmediateDataSource<string[]>(WorkflowDataSourceKeyEnum.RunningWorkflowIds);

    useEffect(() => {
        getInnerData({
            pageSize: defaultPageSize,
        });
    }, []);

    const workflows = useMemo(() => {
        if (!searchInput) {
            return innerData;
        }
        const lowerSearchInput = searchInput.toLowerCase();
        return innerData.filter((workflow) => workflow.name.toLowerCase().includes(lowerSearchInput));
    }, [innerData, searchInput]);

    const columns: TableProps['columns'] = [
        { title: <div className="pl-4">{t('Name')}</div>, width: 403, render: (value, record: IWorkflow) => {
            const schedule = record.schedule;

            return (
                <div className="py-3 pl-4">
                    <div className="text-[#0E111E]">
                        <span>{record.name}</span>
                    </div>
                    {schedule && (
                        <WorkflowScheduleText schedule={schedule} />
                    )}
                </div>
            );
        } },
        { title: <div className="text-center">{t('Run')}</div>, width: 77, render: (value, record: IWorkflow) => {
            const running = record.id ? runningWorkflowIds.includes(record.id) : false;
            return (
                <div className="text-center">
                    <RunButton
                        running={running}
                        onStart={() => {
                            const msg: RunWorkflowMessage = {
                                type: WorkflowMessageTypeEnum.RunWorkflow,
                                payload: record,
                            };
                            chrome.runtime.sendMessage(msg);
                        }}
                        onStop={() => {
                            const msg: StopWorkflowMessage = {
                                type: WorkflowMessageTypeEnum.StopWorkflow,
                                payload: record.id!,
                            };
                            chrome.runtime.sendMessage(msg);
                        }}
                    />
                </div>
            );
        } },
        { title: <div className="text-center">{t('More')}</div>, width: 68, render: (value, record, index) => {
            const menus: DropdownMenuItem[] = [
                {
                    text: t('Edit'),
                    key: EditMenuKey.Edit,
                },
                separateLineMenu,
                {
                    text: <span className="text-[#F05252]">{t('Delete')}</span>,
                    key: EditMenuKey.Delete,
                },
            ];

            return (
                <div className="text-center">
                    <DropdownMenu
                        menus={menus}
                        onChange={(key) => {
                            if (key === EditMenuKey.Delete) {
                                chrome.runtime.sendMessage({
                                    type: WorkflowMessageTypeEnum.DeleteWorkflow,
                                    payload: record.id,
                                });
                            }

                            if (key === EditMenuKey.Edit) {
                                openWorkflowDialog(record);
                            }
                        }}
                    >
                        <MoreButton />
                    </DropdownMenu>
                </div>
            );
        } },
    ];
    if (loading) {
        return (
            <TableLoading text={t('Workflow')} />
        );
    }

    if (workflows.length <= 0) {
        return <WorkflowTableEmpty onClick={() => openWorkflowDialog()} />;
    }

    return <Table rowKey="id" data={workflows} columns={columns} />;
};

