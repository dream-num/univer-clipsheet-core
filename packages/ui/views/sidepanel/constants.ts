import type { IDrillDownColumn, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';

export const typeOptions = [
    { value: Sheet_Cell_Type_Enum.TEXT, label: 'Text' },
    { value: Sheet_Cell_Type_Enum.URL, label: 'Url' },
    { value: Sheet_Cell_Type_Enum.IMAGE, label: 'Image' },
    { value: Sheet_Cell_Type_Enum.VIDEO, label: 'Video' },
];
