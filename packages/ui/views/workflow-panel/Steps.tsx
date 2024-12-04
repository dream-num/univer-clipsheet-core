import clsx from 'clsx';
import React from 'react';
import { linearGradientBackground } from './constants';

export interface IStepItem {
    text: string;
    key: string;
}

export interface IStepsProps {
    currentStep: number;
    onChange?: (step: number) => void;
    items: IStepItem[];
}

export const Steps = (props: IStepsProps) => {
    const { currentStep, items, onChange } = props;

    return (
        <div className="flex">
            {items.map((item, index) => {
                const lessThanCurrentStep = currentStep > index;

                return (
                    <div className="flex items-center" key={item.key}>
                        {/* <button type="button" onClick={() => onChange?.(index)}> */}
                        <div className={clsx('shrink-0 flex items-center justify-center rounded-full w-7 h-7 text-sm', {
                            'bg-[#31C48D] text-white': lessThanCurrentStep,
                            'text-gray-500  bg-gray-100': currentStep < index,
                            [`${linearGradientBackground} text-white`]: currentStep === index,
                        })}
                        >

                            {index + 1}
                        </div>
                        {/* </button> */}
                        <span className={clsx('ml-1.5 text-xs text-nowrap', {
                            'text-[#31C48D]': lessThanCurrentStep,
                            [`bg-clip-text ${linearGradientBackground} text-transparent`]: currentStep === index,
                            'text-gray-500': currentStep < index,
                        })}
                        >
                            {item.text}
                        </span>
                        {index < items.length - 1 && (
                            <div className={clsx('border-t-[1.5px] w-7 mx-2', {
                                'border-[#31C48D] border-solid': lessThanCurrentStep,
                                'border-gray-400 border-dashed  ': currentStep <= index,
                            })}
                            >
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
