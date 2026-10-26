import * as API from 'shared/api';
import {
	AccountMetricType,
	IAccountMetric,
} from 'contacts/pages/account/utils/types';
import {useDataSources} from 'shared/context/dataSources';
import {useParams} from 'react-router-dom';
import {useRequest} from 'shared/hooks/useRequest';

export type LifecycleAccountDataStatus =
	| 'error'
	| 'loading'
	| 'noAccountData'
	| 'noDataSources'
	| 'ready';

export const useLifecycleAccountData = (): {
	refetch: () => void;
	status: LifecycleAccountDataStatus;
} => {
	const {channelId, groupId} = useParams();

	const {empty: noDataSources, loading: dataSourcesLoading} =
		useDataSources();

	const {data, error, loading, refetch} = useRequest({
		dataSourceFn: API.accounts.fetchMetrics,
		skipRequest: dataSourcesLoading || noDataSources,
		variables: {channelId: channelId!, groupId: groupId!},
	});

	const getStatus = (): LifecycleAccountDataStatus => {
		if (dataSourcesLoading) {
			return 'loading';
		}

		if (noDataSources) {
			return 'noDataSources';
		}

		if (loading) {
			return 'loading';
		}

		if (error) {
			return 'error';
		}

		const totalAccounts = (data as IAccountMetric[] | null)?.find(
			({metricType}) => metricType === AccountMetricType.Total
		)?.value;

		return totalAccounts ? 'ready' : 'noAccountData';
	};

	return {refetch, status: getStatus()};
};
