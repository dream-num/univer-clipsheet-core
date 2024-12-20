import { CloseGraySvg, PlusSvg } from '@components/icons';
import { type IMessageRef, Message } from '@components/message';
import { useSyncIframeRectEffect } from '@lib/hooks';
import { t } from '@univer-clipsheet-core/locale';
import type { GetStorageMessage, PushStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, IframeViewTypeEnum, promisifyMessage, sendSetIframeViewMessage } from '@univer-clipsheet-core/shared';
import type { IWorkflow } from '@univer-clipsheet-core/workflow';
import { TimerRepeatMode, WorkflowFilterMode, WorkflowMessageTypeEnum, WorkflowRuleName, WorkflowStorageKeyEnum } from '@univer-clipsheet-core/workflow';
import clsx from 'clsx';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { linearGradientBackground } from '../../lib/constants';
import type { IStepItem } from './Steps';
import { Steps } from './Steps';
import { type IWorkflowPanelContext, WorkflowPanelContext } from './context';
import { DataFilterForm, DataMergeForm, DataSourceForm, RemoveDuplicateForm, TimerForm } from './form';
import type { WorkflowPanelViewService } from './workflow-panel-view.service';

const LeftArrowSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M13.1429 7.57743H4.9268L6.89211 5.43772C6.97398 5.35164 7.03927 5.24867 7.08419 5.13483C7.12911 5.02098 7.15275 4.89853 7.15374 4.77463C7.15473 4.65073 7.13305 4.52785 7.08995 4.41317C7.04685 4.29849 6.98321 4.1943 6.90274 4.10669C6.82226 4.01907 6.72657 3.94978 6.62123 3.90286C6.5159 3.85594 6.40304 3.83233 6.28923 3.83341C6.17543 3.83449 6.06296 3.86023 5.95839 3.90913C5.85382 3.95804 5.75925 4.02913 5.68018 4.11825L2.2518 7.85084C2.17199 7.93752 2.10866 8.0405 2.06545 8.15386C2.02224 8.26723 2 8.38877 2 8.51151C2 8.63425 2.02224 8.75578 2.06545 8.86915C2.10866 8.98252 2.17199 9.08549 2.2518 9.17218L5.68018 12.9048C5.84183 13.0747 6.05834 13.1688 6.28306 13.1667C6.50779 13.1645 6.72276 13.0664 6.88167 12.8934C7.04059 12.7204 7.13073 12.4863 7.13268 12.2417C7.13463 11.997 7.04824 11.7613 6.89211 11.5853L4.9268 9.44372H13.1429C13.3702 9.44372 13.5882 9.34541 13.749 9.17041C13.9097 8.99541 14 8.75806 14 8.51057C14 8.26309 13.9097 8.02574 13.749 7.85074C13.5882 7.67574 13.3702 7.57743 13.1429 7.57743Z" fill="currentColor" />
        </svg>
    );
};

const RightArrowSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M13.9348 8.85613C13.9996 8.68598 14.0166 8.49874 13.9835 8.31811C13.9504 8.13748 13.8687 7.97158 13.7487 7.84139L10.32 4.11758C10.2409 4.02867 10.1463 3.95775 10.0417 3.90896C9.93713 3.86016 9.82465 3.83448 9.71083 3.83341C9.59701 3.83234 9.48414 3.85589 9.37879 3.9027C9.27344 3.94951 9.17774 4.01863 9.09725 4.10604C9.01677 4.19345 8.95312 4.2974 8.91002 4.41181C8.86692 4.52622 8.84523 4.6488 8.84622 4.77242C8.84721 4.89603 8.87085 5.01819 8.91578 5.13177C8.9607 5.24535 9.02601 5.34807 9.10788 5.43395L11.0743 7.56955H2.8572C2.62985 7.56955 2.41182 7.66764 2.25107 7.84222C2.09031 8.01681 2 8.2536 2 8.50051C2 8.74741 2.09031 8.9842 2.25107 9.15879C2.41182 9.33338 2.62985 9.43146 2.8572 9.43146H11.0743L9.10874 11.5661C9.02686 11.652 8.96156 11.7547 8.91664 11.8683C8.87171 11.9819 8.84806 12.1041 8.84707 12.2277C8.84609 12.3513 8.86778 12.4739 8.91088 12.5883C8.95398 12.7027 9.01763 12.8066 9.09811 12.894C9.17859 12.9814 9.2743 13.0506 9.37965 13.0974C9.485 13.1442 9.59787 13.1677 9.71169 13.1667C9.82551 13.1656 9.93799 13.1399 10.0426 13.0911C10.1472 13.0423 10.2417 12.9714 10.3208 12.8825L13.7496 9.15869C13.829 9.07202 13.8919 8.96921 13.9348 8.85613V8.85613Z" fill="currentColor" />
        </svg>
    );
};

export const ScraperGearSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
            <path d="M8.10599 4.35844C9.33959 3.6645 10.763 3.26895 12.2799 3.26895C14.2003 3.26895 15.9704 3.90288 17.3954 4.97324C17.7487 5.2386 18.2501 5.16732 18.5155 4.81405C18.7809 4.46078 18.7096 3.95929 18.3563 3.69394C16.6637 2.4226 14.5587 1.66895 12.2799 1.66895C10.3856 1.66895 8.61176 2.18965 7.09504 3.0953C7.01271 2.79849 6.76183 2.56342 6.43741 2.51689C6.00006 2.45417 5.59467 2.75787 5.53195 3.19523L5.36174 4.38208C5.28334 4.92877 5.66296 5.43551 6.20966 5.51391L7.39651 5.68412C7.83386 5.74684 8.23925 5.44314 8.30197 5.00579C8.33691 4.7622 8.25817 4.52852 8.10599 4.35844Z" fill="url(#paint0_linear_139_9542)" />
            <path fillRule="evenodd" clipRule="evenodd" d="M18.2222 10.6945H17.6335L17.0836 9.36679L17.4997 8.9499C17.6455 8.80404 17.7274 8.60625 17.7274 8.40001C17.7274 8.19377 17.6455 7.99597 17.4997 7.85012L16.3999 6.75034C16.254 6.60453 16.0562 6.52262 15.85 6.52262C15.6438 6.52262 15.446 6.60453 15.3001 6.75034L14.8832 7.16645L13.5556 6.61656V6.02779C13.5556 5.82151 13.4736 5.62368 13.3278 5.47781C13.1819 5.33195 12.9841 5.25001 12.7778 5.25001H11.2222C11.016 5.25001 10.8181 5.33195 10.6723 5.47781C10.5264 5.62368 10.4445 5.82151 10.4445 6.02779V6.61656L9.11679 7.16645L8.6999 6.75034C8.55404 6.60453 8.35625 6.52262 8.15001 6.52262C7.94377 6.52262 7.74597 6.60453 7.60012 6.75034L6.50034 7.85012C6.35453 7.99597 6.27262 8.19377 6.27262 8.40001C6.27262 8.60625 6.35453 8.80404 6.50034 8.9499L6.91723 9.36679L6.36656 10.6945H5.77779C5.57151 10.6945 5.37368 10.7764 5.22781 10.9223C5.08195 11.0681 5.00001 11.266 5.00001 11.4722V13.0278C5.00001 13.2341 5.08195 13.4319 5.22781 13.5778C5.37368 13.7236 5.57151 13.8056 5.77779 13.8056H6.36656L6.57107 14.2989C6.67365 14.5462 6.74176 14.7104 6.91645 15.1332L6.50034 15.5501C6.35453 15.696 6.27262 15.8938 6.27262 16.1C6.27262 16.3062 6.35453 16.504 6.50034 16.6499L7.60012 17.7497C7.74597 17.8955 7.94377 17.9774 8.15001 17.9774C8.35625 17.9774 8.55404 17.8955 8.6999 17.7497L9.11679 17.3336L10.4445 17.8835V18.4722C10.4445 18.6785 10.5264 18.8763 10.6723 19.0222C10.8181 19.1681 11.016 19.25 11.2222 19.25H12.7778C12.9841 19.25 13.1819 19.1681 13.3278 19.0222C13.4736 18.8763 13.5556 18.6785 13.5556 18.4722V17.8835L14.8832 17.3328L15.3001 17.7497C15.446 17.8955 15.6438 17.9774 15.85 17.9774C16.0562 17.9774 16.254 17.8955 16.3999 17.7497L17.4997 16.6499C17.6455 16.504 17.7274 16.3062 17.7274 16.1C17.7274 15.8938 17.6455 15.696 17.4997 15.5501L17.0836 15.1332L17.6335 13.8056H18.2222C18.4285 13.8056 18.6263 13.7236 18.7722 13.5778C18.9181 13.4319 19 13.2341 19 13.0278V11.4722C19 11.266 18.9181 11.0681 18.7722 10.9223C18.6263 10.7764 18.4285 10.6945 18.2222 10.6945ZM12 15.3611C11.3847 15.3611 10.7832 15.1787 10.2716 14.8368C9.75995 14.495 9.36119 14.0091 9.12572 13.4406C8.89024 12.8721 8.82863 12.2466 8.94868 11.6431C9.06872 11.0396 9.36502 10.4852 9.80012 10.0501C10.2352 9.61502 10.7896 9.31872 11.3931 9.19868C11.9966 9.07863 12.6221 9.14024 13.1906 9.37572C13.7591 9.61119 14.245 10.0099 14.5868 10.5216C14.9287 11.0332 15.1111 11.6347 15.1111 12.25C15.1111 13.0751 14.7833 13.8665 14.1999 14.4499C13.6165 15.0333 12.8251 15.3611 12 15.3611Z" fill="url(#paint1_linear_139_9542)" />
            <path d="M15.894 20.1416C14.6604 20.8355 13.237 21.2311 11.7202 21.2311C9.79971 21.2311 8.02963 20.5971 6.60463 19.5268C6.25136 19.2614 5.74987 19.3327 5.48452 19.686C5.21917 20.0392 5.29044 20.5407 5.64371 20.8061C7.33627 22.0774 9.44135 22.8311 11.7202 22.8311C13.6144 22.8311 15.3883 22.3104 16.905 21.4047C16.9873 21.7015 17.2382 21.9366 17.5626 21.9831C18 22.0458 18.4053 21.7421 18.4681 21.3048L18.6383 20.1179C18.7167 19.5712 18.3371 19.0645 17.7904 18.9861L16.6035 18.8159C16.1662 18.7532 15.7608 19.0569 15.698 19.4942C15.6631 19.7378 15.7418 19.9715 15.894 20.1416Z" fill="url(#paint2_linear_139_9542)" />
            <path d="M19.8916 8.35599C20.5855 9.58959 20.9811 11.013 20.9811 12.5299C20.9811 14.4503 20.3471 16.2204 19.2768 17.6454C19.0114 17.9987 19.0827 18.5001 19.436 18.7655C19.7892 19.0309 20.2907 18.9596 20.5561 18.6063C21.8274 16.9137 22.5811 14.8087 22.5811 12.5299C22.5811 10.6356 22.0604 8.86176 21.1547 7.34504C21.4515 7.26271 21.6866 7.01183 21.7331 6.68741C21.7958 6.25006 21.4921 5.84467 21.0548 5.78195L19.8679 5.61174C19.3212 5.53334 18.8145 5.91296 18.7361 6.45966L18.5659 7.64651C18.5032 8.08386 18.8069 8.48925 19.2442 8.55197C19.4878 8.58691 19.7215 8.50817 19.8916 8.35599Z" fill="url(#paint3_linear_139_9542)" />
            <path d="M4.10845 16.144C3.4145 14.9104 3.01895 13.487 3.01895 11.9702C3.01895 10.0497 3.65288 8.27963 4.72324 6.85463C4.9886 6.50136 4.91732 5.99987 4.56405 5.73452C4.21078 5.46917 3.70929 5.54044 3.44394 5.89371C2.1726 7.58627 1.41895 9.69135 1.41895 11.9702C1.41895 13.8644 1.93965 15.6383 2.8453 17.155C2.54849 17.2373 2.31342 17.4882 2.26689 17.8126C2.20417 18.25 2.50787 18.6553 2.94523 18.7181L4.13208 18.8883C4.67877 18.9667 5.18551 18.5871 5.26391 18.0404L5.43412 16.8535C5.49684 16.4162 5.19314 16.0108 4.75579 15.948C4.5122 15.9131 4.27852 15.9918 4.10845 16.144Z" fill="url(#paint4_linear_139_9542)" />
            <defs>
                <linearGradient id="paint0_linear_139_9542" x1="1.41895" y1="12.25" x2="23.5147" y2="12.25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint1_linear_139_9542" x1="1.41895" y1="12.25" x2="23.5147" y2="12.25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint2_linear_139_9542" x1="1.41895" y1="12.25" x2="23.5147" y2="12.25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint3_linear_139_9542" x1="1.41895" y1="12.25" x2="23.5147" y2="12.25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint4_linear_139_9542" x1="1.41895" y1="12.25" x2="23.5147" y2="12.25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
            </defs>
        </svg>
    );
};

enum WorkflowStep {
    Source = 'source',
    Merge = 'merge',
    RemoveDuplicates = 'removeDuplicates',
    Filter = 'filter',
    Timer = 'timer',
}

export interface Rect {
    width: number;
    height: number;
}

function createWorkflow(): IWorkflow {
    return {
        filterMode: WorkflowFilterMode.Remove,
        scraperSettings: [],
        columns: [],
        rules: [],
        name: '',
        schedule: {
            startDate: dayjs().startOf('day').valueOf(),
            minute: 0,
            repeatMode: TimerRepeatMode.Once,
        },
        triggers: [],
    };
}

const DefaultButton = (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return (
        <button {...props} className="cursor-pointer border border-solid border-gray-200 bg-white text-gray-900 px-3 h-8 inline-flex items-center justify-center rounded-full"></button>
    );
};

const PrimaryButton = (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return (
        <button {...props} className={clsx(linearGradientBackground, 'cursor-pointer  text-white px-3 h-8 inline-flex items-center justify-center rounded-full')}></button>
    );
};

const closeWorkflowDialog = () => sendSetIframeViewMessage(IframeViewTypeEnum.None); ;

const InnerWorkflowPanel = (props: {
    service: WorkflowPanelViewService;
}) => {
    const { service } = props;

    const messageRef = useRef<IMessageRef>(null);
    const [workflow, setWorkflow] = useState<IWorkflow>(createWorkflow());
    const [originTableId, setOriginTableId] = useState('');

    const [boundDataSource, setBoundDataSource] = useState(false);
    const contextValue: IWorkflowPanelContext = useMemo(() => {
        return {
            workflow,
            setWorkflow,
            service,
            boundDataSource,
            originTableId,
        };
    }, [originTableId, boundDataSource, workflow, service]);

    useEffect(() => {
        const request: GetStorageMessage = {
            type: ClipsheetMessageTypeEnum.GetStorage,
            payload: WorkflowStorageKeyEnum.CurrentWorkflow,
        };

        chrome.runtime.sendMessage(request);
        const responsePromise = promisifyMessage<PushStorageMessage<IWorkflow>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushStorage && msg.payload.key === WorkflowStorageKeyEnum.CurrentWorkflow);

        responsePromise.then(({ payload }) => {
            const { value } = payload;
            if (value) {
                setBoundDataSource(Boolean(value.id && value.tableId));
                setOriginTableId(value.tableId ?? '');
                setWorkflow((w) => ({ ...w, ...value }));
            }
        });
    }, []);

    const containerRef = React.useRef<HTMLDivElement>(null);
    useSyncIframeRectEffect(containerRef);

    const stepItems: IStepItem[] = [
        {
            key: WorkflowStep.Source,
            text: t('DataSource'),
        },
        {
            key: WorkflowStep.Merge,
            text: t('DataMerge'),
        },
        {
            key: WorkflowStep.RemoveDuplicates,
            text: t('RemoveDuplicates'),
        },
        {
            key: WorkflowStep.Filter,
            text: t('DataFilter'),
        },
        {
            key: WorkflowStep.Timer,
            text: t('Timer'),
        },
    ];

    const [currentStep, setCurrentStep] = React.useState(0);
    const item = stepItems[currentStep];

    const component = useMemo(() => {
        switch (item.key) {
            case WorkflowStep.Merge: {
                return <DataMergeForm />;
            }
            case WorkflowStep.Source: {
                return <DataSourceForm />;
            }
            case WorkflowStep.RemoveDuplicates: {
                return <RemoveDuplicateForm />;
            }
            case WorkflowStep.Filter: {
                return <DataFilterForm />;
            }
            case WorkflowStep.Timer: {
                return <TimerForm />;
            }
            default: {
                return null;
            }
        }
    }, [item.key]);

    function getFinalWorkflow() {
        const rules = workflow?.rules ?? [];

        const removeDuplicatesRule = rules?.find((rule) => rule.name === WorkflowRuleName.RemoveDuplicate);
        if (!removeDuplicatesRule) {
            rules.push({
                name: WorkflowRuleName.RemoveDuplicate,
                payload: workflow.columns.map((column) => column.id),
            });
        }

        const schedule = workflow.schedule;

        if (workflow.schedule.repeatMode !== TimerRepeatMode.Custom) {
            delete schedule.customRule; // Do not save custom rule if not custom mode
        }

        return {
            ...workflow,
            rules,
        };
    }

    const getConfirmButtons = () => {
        // console.log('workflow', workflow);
        const isEdit = Boolean(workflow.id);

        const createOrSaveWorkflow = (toRun: boolean) => {
            const workflowName = workflow?.name;
            if (workflowName.trim().length <= 0) {
                messageRef.current?.showMessage({
                    type: 'error',
                    text: t('WorkflowNameCannotBeEmpty'),
                });
                return;
            }

            chrome.runtime.sendMessage({
                type: isEdit
                    ? WorkflowMessageTypeEnum.UpdateWorkflow
                    : WorkflowMessageTypeEnum.CreateWorkflow,
                payload: {
                    workflow: getFinalWorkflow(),
                    toRun,
                },
            });

            messageRef.current?.showMessage({
                type: 'success',
                text: isEdit ? t('SaveWorkflowSuccessfully') : t('CreateWorkflowSuccessfully'),
                duration: 2000,
                onClose: () => {
                    closeWorkflowDialog();
                },
            });
        };

        return (
            <>
                <DefaultButton onClick={() => {
                    createOrSaveWorkflow(true);
                }}
                >
                    {isEdit ? t('SavetoRun') : t('CreateToRun')}
                </DefaultButton>
                <PrimaryButton onClick={() => createOrSaveWorkflow(false)}>
                    {!isEdit && (
                        <span className="mr-1.5">
                            <PlusSvg />
                        </span>
                    )}

                    <span>{isEdit ? t('Save') : t('Create')}</span>
                </PrimaryButton>
            </>
        );
    };

    const footer = (
        <footer className={clsx('flex mt-4', {
            'justify-between': currentStep > 0,
            'justify-end': currentStep === 0,
        })}
        >
            {currentStep > 0 && (
                <DefaultButton onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
                    <span className="mr-1.5">
                        <LeftArrowSvg />
                    </span>
                    <span>{t('PrevStep')}</span>
                </DefaultButton>
            )}
            {currentStep === stepItems.length - 1
                ? (
                    <div className="flex items-center gap-3">
                        {getConfirmButtons()}
                    </div>
                )
                : (
                    <PrimaryButton onClick={() => setCurrentStep(Math.min(stepItems.length - 1, currentStep + 1))}>
                        <span className="mr-1.5">
                            <RightArrowSvg />
                        </span>
                        <span>{t('NextStep')}</span>
                    </PrimaryButton>
                )}

        </footer>
    );

    return (
        <WorkflowPanelContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                className="w-[744px] rounded-2xl p-5 bg-[#EBF1FF]"
            >
                <div className="flex justify-between mb-4 ">
                    <div className="flex items-center">
                        <ScraperGearSvg />
                        <span className="ml-2 text-lg">{t('Workflow')}</span>
                    </div>
                    <button onClick={closeWorkflowDialog}>
                        <CloseGraySvg />
                    </button>
                </div>
                <div className="rounded-lg shadow px-4 py-3 bg-white ">
                    <Steps currentStep={currentStep} items={stepItems} />
                </div>
                <div className="p-4 rounded-lg shadow  bg-white mt-3">{component}</div>
                {footer}
                <Message ref={messageRef} />
            </div>
        </WorkflowPanelContext.Provider>
    );
};

export const WorkflowPanel = React.memo(InnerWorkflowPanel);
