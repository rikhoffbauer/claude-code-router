interface Provider {
  name: string;
  api_key?: string | string[];
  api_keys?: string[];
}

interface KeyState {
  /** Timestamp when this key leaves blacklist */
  cooldownUntil: number;
  /** Consecutive 429 responses */
  consecutive429: number;
}

interface ApiKeyState {
  index: number;
  keys: string[];
  keyStates: Map<string, KeyState>;
}

const apiKeyMap = new Map<string, ApiKeyState>();

const BASE_COOLDOWN_MS = 60_000; // 1 minute base cooldown

export const initApiKeyRotation = (config: any) => {
  const providers: Provider[] = config.Providers || config.providers || [];
  providers.forEach((provider) => {
    let keys: string[] = [];
    if (Array.isArray(provider.api_key)) {
      keys = provider.api_key.filter(Boolean);
      provider.api_key = keys[0];
    } else if (Array.isArray((provider as any).api_keys)) {
      keys = (provider as any).api_keys.filter(Boolean);
      provider.api_key = keys[0];
    } else if (typeof provider.api_key === "string") {
      keys = [provider.api_key];
    }
    const keyStates = new Map<string, KeyState>();
    keys.forEach((key) => keyStates.set(key, { cooldownUntil: 0, consecutive429: 0 }));
    apiKeyMap.set(provider.name, { index: 0, keys, keyStates });
  });
};

export const getNextApiKey = (providerName: string): string | undefined => {
  const state = apiKeyMap.get(providerName);
  if (!state || state.keys.length === 0) return undefined;
  const now = Date.now();
  for (let i = 0; i < state.keys.length; i++) {
    const idx = (state.index + i) % state.keys.length;
    const key = state.keys[idx];
    const info = state.keyStates.get(key);
    if (!info || info.cooldownUntil <= now) {
      state.index = (idx + 1) % state.keys.length;
      return key;
    }
  }
  return undefined;
};

export const peekNextApiKey = (providerName: string): string | undefined => {
  const state = apiKeyMap.get(providerName);
  if (!state || state.keys.length === 0) return undefined;
  const now = Date.now();
  for (let i = 0; i < state.keys.length; i++) {
    const idx = (state.index + i) % state.keys.length;
    const key = state.keys[idx];
    const info = state.keyStates.get(key);
    if (!info || info.cooldownUntil <= now) {
      return key;
    }
  }
  return undefined;
};

export const reportRateLimit = (providerName: string, key: string) => {
  const state = apiKeyMap.get(providerName);
  if (!state) return;
  const info = state.keyStates.get(key) || { cooldownUntil: 0, consecutive429: 0 };
  info.consecutive429 += 1;
  const delay = BASE_COOLDOWN_MS * Math.pow(2, info.consecutive429 - 1);
  info.cooldownUntil = Date.now() + delay;
  state.keyStates.set(key, info);
};

export const reportSuccess = (providerName: string, key: string) => {
  const state = apiKeyMap.get(providerName);
  if (!state) return;
  const info = state.keyStates.get(key);
  if (!info) return;
  info.consecutive429 = 0;
  info.cooldownUntil = 0;
  state.keyStates.set(key, info);
};
