import rules from './index.json' with { type: 'json' };
export default rules;
export const { packs, version } = rules;
export const allRules = rules.rules;
