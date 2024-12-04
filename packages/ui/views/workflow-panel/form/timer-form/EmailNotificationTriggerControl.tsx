import { t } from '@univer-clipsheet-core/locale';
import { type IWorkflow, WorkflowTriggerName } from '@univer-clipsheet-core/workflow';

export interface IEmailNotificationTriggerControlProps {
    workflow: IWorkflow;
    onChange?: (workflow: IWorkflow) => void;
}
const emailCheckboxId = 'email_notification_checkbox';

export const EmailNotificationTriggerControl: React.FC<IEmailNotificationTriggerControlProps> = (props) => {
    const { workflow, onChange } = props;

    const triggers = workflow?.triggers ?? [];
    const emailTriggerIndex = triggers?.findIndex((trigger) => trigger.name === WorkflowTriggerName.EmailNotification);

    return (
        <div>
            <div className="flex items-center ">
                <input
                    id={emailCheckboxId}
                    checked={emailTriggerIndex !== -1}
                    onChange={(evt) => {
                        const checked = evt.target.checked;
                        if (checked) {
                            onChange?.({
                                ...workflow,
                                triggers: triggers.concat([{ name: WorkflowTriggerName.EmailNotification, payload: null }]),
                            });
                        } else {
                            onChange?.({
                                ...workflow,
                                triggers: triggers.filter((trigger) => trigger.name !== WorkflowTriggerName.EmailNotification),
                            });
                        }
                    }}
                    type="checkbox"
                    className="w-4 h-4 mr-2"
                />
                <label htmlFor={emailCheckboxId} className="text-sm cursor-pointer">{t('SendEmailAfterExecution')}</label>
            </div>
            <div className="text-sm text-gray-600 mb-2">{t('WorkflowSendEmailTips')}</div>
        </div>
    );
};
