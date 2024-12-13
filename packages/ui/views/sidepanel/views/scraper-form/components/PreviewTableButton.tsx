import { EyelashSvg, EyeSvg } from '@components/icons';
import { usePromise, useStorageValue } from '@lib/hooks';
import { t } from '@univer-clipsheet-core/locale';
import { type IScraper, type PreviewScraperTableMessage, ScraperMessageTypeEnum } from '@univer-clipsheet-core/scraper';
import { getActiveTab, IframeViewTypeEnum, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { IPreviewSheetStorageValue } from '@univer-clipsheet-core/table';
import { PreviewSheetFromEnum, TableStorageKeyEnum } from '@univer-clipsheet-core/table';
import { useCallback, useRef } from 'react';

export interface PreviewTableButtonProps {
    scraper: IScraper;
}

export const PreviewTableButton = (props: PreviewTableButtonProps) => {
    const { scraper } = props;
    const [previewSheet, setPreviewSheet] = useStorageValue<IPreviewSheetStorageValue | null>(TableStorageKeyEnum.PreviewSheet, null);

    const [iframeView, setIframeView] = useStorageValue<IframeViewTypeEnum>(UIStorageKeyEnum.IframeView, IframeViewTypeEnum.None);

    const previewingRef = useRef(false);
    previewingRef.current = iframeView === IframeViewTypeEnum.PreviewTablePanel && previewSheet?.from === PreviewSheetFromEnum.ScraperForm;

    const activeTab = usePromise(getActiveTab);
    const currentTabUrl = activeTab?.url;

    const handlePreviewTable = useCallback(() => {
        if (previewingRef.current) {
            setIframeView(IframeViewTypeEnum.None);
            setPreviewSheet?.(null);
        } else {
            const msg: PreviewScraperTableMessage = {
                type: ScraperMessageTypeEnum.PreviewScraperTable,
                payload: {
                    selector: scraper.targetSelector,
                    columnNames: scraper.columns.map((column) => column.name),
                },
            };

            if (activeTab?.id) {
                chrome.tabs.sendMessage(activeTab.id, msg);
            }
        }
    }, [activeTab, scraper]);

    if (currentTabUrl !== scraper?.url) {
        return null;
    }

    return (
        <button onClick={handlePreviewTable} className="ml-1.5 inline-flex items-center text-xs text-[#274FEE]">
            {previewingRef.current ? <EyelashSvg /> : <EyeSvg /> }
            <span className="ml-0.5">{t(previewingRef.current ? 'HideView' : 'ViewTable')}</span>
        </button>
    );
};
