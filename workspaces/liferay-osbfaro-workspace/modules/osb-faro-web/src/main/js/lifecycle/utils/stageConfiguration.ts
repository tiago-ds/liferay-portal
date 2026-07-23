import {LifecycleStages} from '../../contacts/pages/account/utils/constants';
import {sub} from 'shared/util/lang';

export const LIFECYCLE_STAGE_ORDER: LifecycleStages[] = [
	LifecycleStages.AWARE,
	LifecycleStages.ENGAGED,
	LifecycleStages.PIPELINE,
	LifecycleStages.ONBOARDING,
	LifecycleStages.ESTABLISHED,
	LifecycleStages.AT_RISK,
];

export const DEFAULT_MAX_DAYS = 90;

export const STAGE_DESCRIPTIONS: Record<LifecycleStages, string> = {
	[LifecycleStages.AT_RISK]: Liferay.Language.get(
		'accounts-with-decreasing-product-usage-or-signs-of-churn-risk.-action-is-required'
	),
	[LifecycleStages.AWARE]: Liferay.Language.get(
		'identifies-cold-accounts-showing-early-intent-so-marketing-can-run-targeted-ads'
	),
	[LifecycleStages.ENGAGED]: Liferay.Language.get(
		'the-buying-committee-is-researching-us.-triggers-warm-call-alerts-to-sales'
	),
	[LifecycleStages.ESTABLISHED]: Liferay.Language.get(
		'account-is-healthy-and-realizing-roi.-safe-to-pitch-expansion-add-ons'
	),
	[LifecycleStages.ONBOARDING]: Liferay.Language.get(
		'contract-signed.-90-day-use-clock-starts-to-ensure-the-software-machinery-is-used'
	),
	[LifecycleStages.PIPELINE]: Liferay.Language.get(
		'active-deal.-automatically-halts-generic-marketing-spend-so-sales-can-work-the-account'
	),
};

export interface IEntityOption {
	label: string;
	value: string;
}

export type ConditionKey = 'field' | 'operator';

export interface IConditionStep {
	key: ConditionKey;
	placeholder: string;
}

export const CONDITION_STEPS: IConditionStep[] = [
	{
		key: 'field',
		placeholder: sub(Liferay.Language.get('select-x'), [
			Liferay.Language.get('field'),
		]) as string,
	},
	{
		key: 'operator',
		placeholder: sub(Liferay.Language.get('select-x'), [
			Liferay.Language.get('operator'),
		]) as string,
	},
];

export interface IStageConfig {
	conditionValue: string | null;
	description: string;
	field: string | null;
	fieldDataCategory: string | null;
	fieldDataType: string | null;
	maxTimeDays: number;
	maxTimeEnabled: boolean;
	operator: string | null;
}

export const createDefaultStageConfigs = (): IStageConfig[] =>
	LIFECYCLE_STAGE_ORDER.map((stageType) => ({
		conditionValue: null,
		description: STAGE_DESCRIPTIONS[stageType],
		field: null,
		fieldDataCategory: null,
		fieldDataType: null,
		maxTimeDays: DEFAULT_MAX_DAYS,
		maxTimeEnabled: true,
		operator: null,
	}));
