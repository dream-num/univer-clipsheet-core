import type { IWorkflowColumn, WorkflowRemoveDuplicateRule } from '@univer-clipsheet-core/workflow';
import { WorkflowRuleName } from '@univer-clipsheet-core/workflow';
import { ColumnTypeTag } from '@components/ColumnTypeTag';
import { t } from '@univer-clipsheet-core/locale';
import { useWorkflowPanelContext } from '../context';
import { ColumnList, type ColumnListItem } from '../components/ColumnList';

const ExchangeSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M12.6665 9.16659C12.2985 9.16659 11.9998 9.46526 11.9998 9.83326V11.1666H3.60915L4.47115 10.3046C4.73182 10.0439 4.73182 9.62259 4.47115 9.36192C4.21048 9.10126 3.78915 9.10126 3.52848 9.36192L1.52848 11.3619C1.46715 11.4233 1.41848 11.4973 1.38448 11.5786C1.31715 11.7419 1.31715 11.9253 1.38448 12.0879C1.41848 12.1693 1.46715 12.2433 1.52848 12.3046L3.52848 14.3046C3.65848 14.4346 3.82915 14.4999 3.99982 14.4999C4.17048 14.4999 4.34115 14.4346 4.47115 14.3046C4.73182 14.0439 4.73182 13.6226 4.47115 13.3619L3.60915 12.4999H12.6665C13.0345 12.4999 13.3332 12.2013 13.3332 11.8333V9.83326C13.3332 9.46526 13.0345 9.16659 12.6665 9.16659Z" fill="currentColor" />
            <path d="M14.6152 4.91192C14.5812 4.83059 14.5325 4.75659 14.4712 4.69526L12.4712 2.69526C12.2105 2.43459 11.7892 2.43459 11.5285 2.69526C11.2678 2.95592 11.2678 3.37726 11.5285 3.63792L12.3905 4.49992H3.33315C2.96515 4.49992 2.66648 4.79859 2.66648 5.16659V7.16659C2.66648 7.53459 2.96515 7.83326 3.33315 7.83326C3.70115 7.83326 3.99982 7.53459 3.99982 7.16659V5.83326H12.3905L11.5285 6.69526C11.2678 6.95592 11.2678 7.37726 11.5285 7.63792C11.6585 7.76792 11.8292 7.83326 11.9998 7.83326C12.1705 7.83326 12.3412 7.76792 12.4712 7.63792L14.4712 5.63792C14.5325 5.57659 14.5812 5.50259 14.6152 5.42126C14.6825 5.25859 14.6825 5.07459 14.6152 4.91192Z" fill="currentColor" />
        </svg>
    );
};

export const RemoveDuplicateForm = () => {
    const { workflow, setWorkflow } = useWorkflowPanelContext();
    const columns = workflow?.columns ?? [];

    const rules = workflow?.rules ?? [];
    const ruleIndex = rules.findIndex((r) => r.name === WorkflowRuleName.RemoveDuplicate);
    const rule = rules[ruleIndex] as WorkflowRemoveDuplicateRule | undefined;
    const columnValues = rule?.payload ?? [];

    const setColumnValues = (values: string[]) => {
        const innerWorkflow = workflow!;

        if (ruleIndex < 0) {
            setWorkflow?.({
                ...innerWorkflow,
                rules: [...innerWorkflow.rules, {
                    name: WorkflowRuleName.RemoveDuplicate,
                    payload: values,
                }],
            });
        } else {
            innerWorkflow.rules[ruleIndex].payload = values;
            setWorkflow?.({
                ...innerWorkflow,
                rules,
            });
        }
    };

    const columnItems: ColumnListItem<IWorkflowColumn>[] = [
        {
            header: (
                <div className="px-4 ">
                    <input
                        type="checkbox"
                        className="px-4 w-4 h-4"
                        id="check-all"
                        checked={columnValues.length === columns.length}
                        onChange={(evt) => {
                            if (evt.target.checked) {
                                setColumnValues(columns.map((column) => column.id));
                            } else {
                                setColumnValues([]);
                            }
                        }}
                    />
                </div>
            ),
            render: (data, index) => {
                return (
                    <div className="px-4 ">
                        <input
                            type="checkbox"
                            size={16}
                            className="w-4 h-4"
                            checked={columnValues.includes(data.id)}
                            onChange={(evt) => {
                                if (evt.target.checked) {
                                    setColumnValues(columnValues.concat([data.id]));
                                } else {
                                    setColumnValues(columnValues.filter((value) => value !== data.id));
                                }
                            }}
                        />

                    </div>

                );
            },
        },
        {
            header: <div className="flex items-center px-3 grow text-xs text-gray-500  h-full ">{t('ColumnName')}</div>,
            columnClassName: 'grow',
            render: (data, index) => {
                return (
                    <div className="flex items-center px-3 grow text-gray-900 text-xs  h-full ">
                        {data.name}
                    </div>
                );
            },
        },
        {
            header: <div className="text-xs text-gray-500">{t('Type')}</div>,
            columnClassName: 'h-full border-box w-24 px-3 flex items-center justify-center',
            render: (data, index) => {
                return (
                    <ColumnTypeTag type={data.type} />
                );
            },
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between text-gray-900 text-sm mb-2">
                <span>
                    {t('SelectTheColumnsToCompareForDuplicate')}
                    :
                </span>
                <button
                    onClick={() => {
                        setColumnValues(columns
                            .filter((column) => !columnValues.includes(column.id))
                            .map((column) => column.id));
                    }}
                    type="button"
                    className="h-6 px-1.5 inline-flex text-indigo-600 cursor-pointer hover:bg-gray-100 rounded"
                >
                    <ExchangeSvg />
                    <span className="ml-1.5">{t('InverseSelection')}</span>
                </button>
            </div>
            <ColumnList<IWorkflowColumn> listClassName="overflow-y-auto max-h-[400px]" headerClassName="h-[38px]" rowClassName="h-10 hover:bg-indigo-100" data={columns} columns={columnItems} />
        </div>
    );
};
