import {IEntityOption, IStageConfig} from 'lifecycle/utils/stageConfiguration';

export type OperatorType = 'Boolean' | 'Date' | 'Duration' | 'Number' | 'Text';

const NUMBER_OPERATORS: IEntityOption[] = [
	{label: 'is equal to', value: 'eq'},
	{label: 'greater than', value: 'gt'},
	{label: 'less than', value: 'lt'},
	{label: 'is not equal to', value: 'neq'},
	{label: 'is known', value: 'is-known'},
	{label: 'is unknown', value: 'is-unknown'},
];

export const OPERATORS_BY_TYPE: Record<OperatorType, IEntityOption[]> = {
	Boolean: [
		{label: 'true', value: 'true'},
		{label: 'false', value: 'false'},
	],
	Date: [
		{label: 'is before', value: 'before'},
		{label: 'is on', value: 'on'},
		{label: 'is after', value: 'after'},
	],
	Duration: NUMBER_OPERATORS,
	Number: NUMBER_OPERATORS,
	Text: [
		{label: 'is', value: 'is'},
		{label: 'is not', value: 'is-not'},
		{label: 'contains', value: 'contains'},
		{label: 'does not contain', value: 'does-not-contain'},
		{label: 'is known', value: 'is-known'},
		{label: 'is unknown', value: 'is-unknown'},
	],
};

export const VALUELESS_OPERATORS = new Set([
	'false',
	'is-known',
	'is-unknown',
	'true',
]);

export const isStageConfigured = (stage: IStageConfig): boolean =>
	!!stage.description.trim() &&
	((!!stage.operator && VALUELESS_OPERATORS.has(stage.operator)) ||
		!!stage.conditionValue);

export const resolveOperatorType = (
	dataCategory: string | null,
	dataType: string | null
): OperatorType | null => {
	if (!dataCategory) {
		return null;
	}

	if (dataType === 'DURATION') {
		return 'Duration';
	}

	return dataCategory as OperatorType;
};
