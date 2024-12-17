import React, { useEffect } from 'react';
import { useStorageValue } from '@lib/hooks';
import type { IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { useCurrentScraper } from '@views/sidepanel/hooks';
import { getActiveTabId, pingSignal, PingSignalKeyEnum, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { ScraperEditForm } from './ScraperEditForm';
import { ScraperCreateForm } from './ScraperCreateForm';

export interface IScraperFormProps {
    onColumnEdit?: (column: IScraperColumn, scraper: IScraper) => void;
}

function InnerScraperForm(props: IScraperFormProps) {
    const { onColumnEdit } = props;
    const [scraperFormReadonly] = useStorageValue(UIStorageKeyEnum.ScraperFormReadonly, false);
    const [scraper] = useCurrentScraper();

    useEffect(() => {
        let dispose: () => void;

        getActiveTabId().then((tabId) => {
            if (!tabId) {
                return;
            }
            dispose = pingSignal(PingSignalKeyEnum.ScraperFormShowed, tabId);
        });

        return () => {
            dispose?.();
        };
    }, []);

    return scraper.id
        ? <ScraperEditForm onColumnEdit={onColumnEdit} readonly={scraperFormReadonly} data={scraper} />
        : <ScraperCreateForm onColumnEdit={onColumnEdit} data={scraper} />;
}

export const ScraperForm = React.memo(InnerScraperForm);
