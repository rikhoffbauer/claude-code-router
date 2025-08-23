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
      const models = value.map((m) => m?.trim()).filter(Boolean);
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
    const models = value.map((m) => m?.trim()).filter(Boolean);
    if (models.length === 0) return undefined;
    let state = modelMap.get(field);
    if (!state) {
      state = { index: 0, models };
      modelMap.set(field, state);
    } else {
      state.models = models;
      if (
        typeof state.index !== "number" ||
        state.index < 0 ||
        state.index >= state.models.length
      ) {
        state.index = 0;
      }
    }
    const model = state.models[state.index];
    state.index = (state.index + 1) % state.models.length;
    return model;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return undefined;
};

export const clearModelRotation = () => {
  modelMap.clear();
};
