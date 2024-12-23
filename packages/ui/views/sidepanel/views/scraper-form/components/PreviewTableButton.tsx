import { EyelashSvg, EyeSvg } from '@components/icons';
import { useActiveTab, useStorageValue } from '@lib/hooks';
import { t } from '@univer-clipsheet-core/locale';
import { type IScraper, type PreviewScraperTableMessage, ScraperMessageTypeEnum } from '@univer-clipsheet-core/scraper';
import { IframeViewTypeEnum, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { IPreviewSheetStorageValue } from '@univer-clipsheet-core/table';
import { PreviewSheetFromEnum, TableStorageKeyEnum } from '@univer-clipsheet-core/table';
import React, { useCallback, useMemo } from 'react';

export interface PreviewTableButtonProps {
    scraper: IScraper;
}

const InnerPreviewTableButton = (props: PreviewTableButtonProps) => {
    const { scraper } = props;

    const activeTab = useActiveTab();
    const [previewSheet, setPreviewSheet] = useStorageValue<IPreviewSheetStorageValue | null>(TableStorageKeyEnum.PreviewSheet, null);

    const [iframeView, setIframeView] = useStorageValue<IframeViewTypeEnum>(UIStorageKeyEnum.IframeView, IframeViewTypeEnum.None);

    const previewing = iframeView === IframeViewTypeEnum.PreviewTablePanel && previewSheet?.from === PreviewSheetFromEnum.ScraperForm;

    const handlePreviewTable = useCallback(() => {
        if (previewing) {
            setIframeView(IframeViewTypeEnum.None);
            setPreviewSheet?.(null);
        } else {
            const msg: PreviewScraperTableMessage = {
                type: ScraperMessageTypeEnum.PreviewScraperTable,
                payload: {
                    selector: scraper.targetSelector,
                    columns: scraper.columns.slice(),
                },
            };

            if (activeTab?.id) {
                chrome.tabs.sendMessage(activeTab.id, msg);
            }
        }
    }, [previewing, scraper, activeTab]);

    const ableToPreview = useMemo(() => {
        const tabUrlStr = activeTab?.url;
        if (!tabUrlStr) {
            return false;
        }

        try {
            const tabUrl = new URL(tabUrlStr);
            const scraperUrl = new URL(scraper.url);

            return tabUrl.origin === scraperUrl.origin
            && tabUrl.pathname === scraperUrl.pathname;
        } catch (e) {
            return false;
        }
    }, [activeTab, scraper]);

    if (!ableToPreview) {
        return null;
    }

    return (
        <button onClick={handlePreviewTable} className="ml-1.5 inline-flex items-center text-xs text-[#274FEE]">
            {previewing ? <EyelashSvg /> : <EyeSvg /> }
            <span className="ml-0.5">{t(previewing ? 'HideView' : 'ViewTable')}</span>
        </button>
    );
};

export const PreviewTableButton = React.memo(InnerPreviewTableButton);
