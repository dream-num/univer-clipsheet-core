
import React, { useMemo, useRef, useState } from 'react';
import type { IMessageRef } from '@components/message';
import { Message } from '@components/message';
import type { IDrillDownConfig, IScraperColumn } from '@univer-clipsheet-core/scraper';

// import { StorageKeys } from '@chrome-extension-boilerplate/shared';
import { SidePanelContext, SidePanelViewEnum } from '@views/sidepanel/context';
import { useCurrentScraper } from '@views/sidepanel//hooks';
// import { ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';
import { getActiveTab, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { useStorageValue } from '@lib/hooks';
// import { SidePanelView } from './views/SidePanelView';
// import { SidePanelContext, SidePanelViewEnum } from './context';
import type { ISidePanelContext } from './context';
import { ScraperEditForm, ScraperForm } from './views/scraper-form';
import { DrillDownColumnForm } from './views/drill-down-column-form';

function createDrillDownConfig(parentId: string): IDrillDownConfig {
    return {
        parentId,
        minInterval: 3,
        maxInterval: 6,
        columns: [],
    };
}

function CompositedScraperForm(props: {
    onColumnEdit?: (column: IScraperColumn) => void;
}) {
    const { onColumnEdit } = props;
    const [scraperFormReadonly] = useStorageValue(UIStorageKeyEnum.ScraperFormReadonly, false);
    const [scraper] = useCurrentScraper();

    return 'id' in scraper
        ? <ScraperEditForm onColumnEdit={onColumnEdit} readonly={scraperFormReadonly} data={scraper} />
        : <ScraperForm onColumnEdit={onColumnEdit} data={scraper} />;
}

async function navigateTo(url: string) {
    const tab = await getActiveTab();
    if (tab.id) {
        chrome.tabs.update(tab.id, { url });
    }
}

export function SidePanel() {
    const [view, setView] = useState(SidePanelViewEnum.ScraperForm);

    const [drillDownConfig, setDrillDownConfig] = useState<IDrillDownConfig | undefined>();
    const columnUrlRef = useRef<string | undefined>(undefined);

    const messageRef = useRef<IMessageRef>(null);

    const context: ISidePanelContext = useMemo(() => {
        return {
            // view,
            // setView,
            get message() {
                return messageRef.current;
            },
        };
    }, []);

    return (
        <SidePanelContext.Provider value={context}>
            <>
                <Message className="z-[1060]" ref={messageRef} />
                {view === SidePanelViewEnum.DrillDownColumnForm
                    ? (
                        <DrillDownColumnForm
                            config={drillDownConfig}
                            onBack={() => {
                                if (columnUrlRef.current) {
                                    navigateTo(columnUrlRef.current);
                                    columnUrlRef.current = undefined;
                                }
                                setView(SidePanelViewEnum.ScraperForm);
                                // navigateTo(c.url)
                            }}
                            onConfirm={(s) => {
                                columnUrlRef.current = undefined;
                            }}
                        />
                    )
                    : (
                        <CompositedScraperForm onColumnEdit={(c) => {
                            if (!c.url) {
                                return;
                            }
                            columnUrlRef.current = c.url;
                            navigateTo(c.url)
                                .then(() => {
                                    setView(SidePanelViewEnum.DrillDownColumnForm);
                                });
                            setDrillDownConfig(createDrillDownConfig(c.id));
                        }}
                        />
                    ) }
            </>
        </SidePanelContext.Provider>
    );
}

