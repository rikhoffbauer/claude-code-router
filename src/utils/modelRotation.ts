export interface ModelState {
  index: number;
  models: string[];
}

const modelMap = new Map<string, ModelState>();

const ROUTER_FIELDS = [
  "default",
  "longContext",
  "background",
  "think",
  "webSearch",
];

export const initModelRotation = (config: any) => {
  const router = config.Router || {};
  ROUTER_FIELDS.forEach((field) => {
    const value = router[field];
    if (Array.isArray(value)) {
      const models = value.filter(Boolean);
      if (models.length > 0) {
        modelMap.set(field, { index: 0, models });
      }
    }
  });
};

export const getNextModel = (
  field: string,
  value: string | string[] | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    const state = modelMap.get(field);
    if (!state || state.models.length === 0) return undefined;
    const model = state.models[state.index];
    state.index = (state.index + 1) % state.models.length;
    return model;
  }
  return value;
};
