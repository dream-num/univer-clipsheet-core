import { t } from '@univer-clipsheet-core/locale';
import { LoadingMask } from './LoadingMask';

export const TableLoading = (props: {
    text: string;
}) => {
    const { text } = props;

    return (
        <div className="relative h-full">
            <LoadingMask
                className="z-10 text-[#0B9EFB]"
                loadingClassName="w-10 h-10"
                text={(
                    <span className="mt-1">
                        {t('LoadingWith', {
                            text,
                        })}
                    </span>
                )}
            />
        </div>
    );
};
