import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { ObjectValidator } from '@univer-clipsheet-core/shared';
import { AutoExtractionMode, type IScraper, type IScraperColumn } from './scraper';

const columnTypes = [
    Sheet_Cell_Type_Enum.TEXT,
    Sheet_Cell_Type_Enum.URL,
    Sheet_Cell_Type_Enum.IMAGE,
    Sheet_Cell_Type_Enum.VIDEO,
];

const autoExtractionModes = [
    AutoExtractionMode.None,
    AutoExtractionMode.Click,
    AutoExtractionMode.Scroll,
    AutoExtractionMode.PageUrl,
];

function validateColumn(columnLike: Record<string, any>): columnLike is IScraperColumn {
    const requiredColumnFields = ['name', 'type', 'index'];
    for (const field of requiredColumnFields) {
        if (!(field in columnLike)) {
            return false;
        }
    }

    if (!columnTypes.includes(columnLike.type as number)) {
        return false;
    }

    return true;
}

export const scraperValidator = new ObjectValidator<IScraper>({
    requiredFields: ['mode', 'targetSelector', 'name', 'columns', 'url'],
    fieldRules: {
        mode(value, target) {
            const isMode = autoExtractionModes.includes(value as number);
            if (!isMode) {
                return false;
            }
            if (value !== AutoExtractionMode.None && !target.config) {
                return false;
            }

            return true;
        },
        columns(value) {
            if (!Array.isArray(value)) {
                return false;
            }

            for (const column of value) {
                if (!validateColumn(column)) {
                    return false;
                }
            }

            return true;
        },
        name: (v) => Boolean(v),
    },
});

export const scraperIOHelper = {
    toJSON(_scraper: IScraper) {
        const scraper = { ..._scraper };

        // @ts-ignore
        delete scraper.id;

        return JSON.stringify(scraper, null, 2);
    },
    parse(jsonStr: string) {
        try {
            const scraperLike = JSON.parse(jsonStr);
            const validation = this.validate(scraperLike);
            if (!validation) {
                return null;
            }

            return scraperLike;
        } catch {
            return null;
        }
    },
    validate(scraperLike: Record<string, any>) {
        return scraperValidator.validate(scraperLike);
    },
};
