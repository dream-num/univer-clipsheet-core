
import { FeatureButton } from '@components/buttons';
import { openWorkflowDialog } from '@lib/helper';
import { t } from '@univer-clipsheet-core/locale';

export const WorkflowFooter = () => {
    return <FeatureButton className="w-full" onClick={() => openWorkflowDialog()}>{t('WorkflowEmptyAction')}</FeatureButton>;
};
