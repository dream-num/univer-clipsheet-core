import React from 'react';
import { useStorageValue } from '@lib/hooks';
import type { IScraperColumn } from '@univer-clipsheet-core/scraper';
import { useCurrentScraper } from '@views/sidepanel/hooks';
import { UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { ScraperEditForm } from './ScraperEditForm';
import { ScraperCreateForm } from './ScraperCreateForm';

export interface IScraperFormProps {
    onColumnEdit?: (column: IScraperColumn) => void;
}

function InnerScraperForm(props: IScraperFormProps) {
    const { onColumnEdit } = props;
    const [scraperFormReadonly] = useStorageValue(UIStorageKeyEnum.ScraperFormReadonly, false);
    const [scraper] = useCurrentScraper();

    return scraper.id
        ? <ScraperEditForm onColumnEdit={onColumnEdit} readonly={scraperFormReadonly} data={scraper} />
        : <ScraperCreateForm onColumnEdit={onColumnEdit} data={scraper} />;
}

export const ScraperForm = React.memo(InnerScraperForm);
