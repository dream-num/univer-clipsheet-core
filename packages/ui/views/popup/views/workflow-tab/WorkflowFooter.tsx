
import { FeatureButton } from '@components/buttons';
import { t } from '@univer-clipsheet-core/locale';
import { openWorkflowDialog } from './helper';

export const WorkflowFooter = () => {
    return <FeatureButton className="w-full" onClick={() => openWorkflowDialog()}>{t('WorkflowEmptyAction')}</FeatureButton>;
};
