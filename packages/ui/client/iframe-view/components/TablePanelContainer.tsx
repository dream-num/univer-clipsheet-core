import type { ObservableValue } from '@univer-clipsheet-core/shared';
import { IframeContainer } from './IframeContainer';

export interface IframeContainerProps {
    iframeSrc$: ObservableValue<string>;
}

export const TablePanelContainer = (props: IframeContainerProps) => {
    return <IframeContainer iframeSrc$={props.iframeSrc$} className="table-panel-iframe" />;
};
