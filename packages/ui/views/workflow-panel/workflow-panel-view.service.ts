import { ObservableValue } from '@univer-clipsheet-core/shared';

export class WorkflowPanelViewService {
    emailNotificationTriggerControl$ = new ObservableValue<boolean>(false);

    setEmailNotificationTriggerControl(value: boolean) {
        this.emailNotificationTriggerControl$.next(value);
    }
}
