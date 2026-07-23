import {
	IStageConfig,
	LIFECYCLE_STAGE_ORDER,
} from 'lifecycle/utils/stageConfiguration';
import {resolveOperatorType} from 'lifecycle/utils/lifecycleOperators';

export interface IStageSegmentPayload {
	filter: string;
	filterMetadata: string;
}

export interface IStagePayload {
	description: string;
	displayOrder: number;
	maxDuration: number | null;
	segment: IStageSegmentPayload;
	stageType: string;
}

export interface ICreateLifecyclePayload {
	channelId: string;
	groupId: string;
	name: string;
	stages: IStagePayload[];
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

const buildExpression = (stage: IStageConfig): string => {
	const {conditionValue, field, operator} = stage;

	if (operator === 'is-known') {
		return `${field} ne null`;
	}

	if (operator === 'is-unknown') {
		return `${field} eq null`;
	}

	if (operator === 'true' || operator === 'false') {
		return `${field} eq '${operator}'`;
	}

	const type = resolveOperatorType(
		stage.fieldDataCategory,
		stage.fieldDataType
	);

	const raw = conditionValue ?? '';

	const isNumeric = type === 'Number' || type === 'Duration';

	if (isNumeric && (raw.trim() === '' || !Number.isFinite(Number(raw)))) {
		return '';
	}

	const literal = isNumeric ? raw.trim() : quote(raw);

	switch (operator) {
		case 'after':
		case 'gt':
			return `${field} gt ${literal}`;
		case 'before':
		case 'lt':
			return `${field} lt ${literal}`;
		case 'contains':
			return `contains(${field}, ${literal})`;
		case 'does-not-contain':
			return `not contains(${field}, ${literal})`;
		case 'eq':
		case 'is':
		case 'on':
			return `${field} eq ${literal}`;
		case 'is-not':
		case 'neq':
			return `${field} ne ${literal}`;
		default:
			return '';
	}
};

export const buildStageFilter = (stage: IStageConfig): string => {
	if (!stage.field || !stage.operator) {
		return '';
	}

	const expression = buildExpression(stage);

	return expression ? `(${expression})` : '';
};

export const buildStageFilterMetadata = (stage: IStageConfig): string =>
	JSON.stringify({
		conditionValue: stage.conditionValue,
		field: stage.field,
		fieldDataCategory: stage.fieldDataCategory,
		fieldDataType: stage.fieldDataType,
		operator: stage.operator,
	});

export const buildCreateLifecyclePayload = ({
	channelId,
	groupId,
	name,
	stageConfigs,
}: {
	channelId: string;
	groupId: string;
	name: string;
	stageConfigs: IStageConfig[];
}): ICreateLifecyclePayload => ({
	channelId,
	groupId,
	name,
	stages: stageConfigs.map((stage, index) => ({
		description: stage.description,
		displayOrder: index + 1,
		maxDuration: stage.maxTimeEnabled ? stage.maxTimeDays : null,
		segment: {
			filter: buildStageFilter(stage),
			filterMetadata: buildStageFilterMetadata(stage),
		},
		stageType: LIFECYCLE_STAGE_ORDER[index],
	})),
});
