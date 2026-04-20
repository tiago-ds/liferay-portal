import sendRequest from 'shared/util/request';

export async function fetchOverviewMetrics({
	country,
	groupId,
	industry,
	lifecycleId
}) {
	return sendRequest({
		data: {
			...(country && {country}),
			...(industry && {industry})
		},
		method: 'GET',
		path: `contacts/${groupId}/account_lifecycle/${lifecycleId}/overview`
	});
}
