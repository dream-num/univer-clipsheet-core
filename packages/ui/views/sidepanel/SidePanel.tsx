
import type { IMessageRef } from '@components/message';
import { Message } from '@components/message';
import { type IDrillDownConfig, setCurrentScraper } from '@univer-clipsheet-core/scraper';
import { useMemo, useRef, useState } from 'react';
import { getActiveTab } from '@univer-clipsheet-core/shared';
import { SidePanelContext, SidePanelViewEnum } from '@views/sidepanel/context';
import type { ISidePanelContext } from './context';
import { DrillDownColumnForm } from './views/drill-down-column-form';
import { ScraperForm } from './views/scraper-form';
import type { SidePanelViewService } from './side-panel-view.service';

function createDrillDownConfig(parentId: string): IDrillDownConfig {
    return {
        parentId,
        minInterval: 3,
        maxInterval: 6,
        columns: [],
    };
}

async function navigateTo(url: string) {
    const tab = await getActiveTab();
    if (tab.id) {
        chrome.tabs.update(tab.id, { url });
    }
}

export interface ISidePanelProps {
    service: SidePanelViewService;
}

export function SidePanel(props: ISidePanelProps) {
    const { service } = props;
    const [view, setView] = useState(SidePanelViewEnum.ScraperForm);

    const [drillDownConfig, setDrillDownConfig] = useState<IDrillDownConfig | undefined>();
    const [drillDownFormLoading, setDrillDownFormLoading] = useState(false);
    const columnUrlRef = useRef<string | undefined>(undefined);

    const messageRef = useRef<IMessageRef>(null);

    const context: ISidePanelContext = useMemo(() => {
        return {
            service,
            get message() {
                return messageRef.current;
            },
        };
    }, [service]);

    return (
        <SidePanelContext.Provider value={context}>
            <>
                <Message className="z-[1060]" ref={messageRef} />
                {view === SidePanelViewEnum.DrillDownColumnForm
                    ? (
                        <DrillDownColumnForm
                            loading={drillDownFormLoading}
                            config={drillDownConfig}
                            onBack={() => {
                                setView(SidePanelViewEnum.ScraperForm);
                                const url = columnUrlRef.current;
                                if (url) {
                                    navigateTo(url);
                                }
                            }}
                            onConfirm={async (_config) => {
                                setDrillDownFormLoading(true);
                                const config = await service.generateDrillDownConfig(_config).finally(() => {
                                    setDrillDownFormLoading(false);
                                });

                                setView(SidePanelViewEnum.ScraperForm);

                                setCurrentScraper((scraper) => {
                                    const column = scraper.columns.find((c) => c.id === config.parentId);
                                    if (column) {
                                        column.drillDownConfig = { ...config, columns: config.columns.slice() };
                                    }

                                    return { ...scraper };
                                });

                                const url = columnUrlRef.current;
                                if (url) {
                                    navigateTo(url);
                                }
                            }}
                        />
                    )
                    : (
                        <ScraperForm onColumnEdit={(c) => {
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

