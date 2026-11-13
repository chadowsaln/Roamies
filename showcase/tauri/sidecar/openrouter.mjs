// OpenRouter model discovery: https://openrouter.ai/api/v1/models
// Fetches the full OpenRouter model catalog using the account's API key,
// so Roamies is never restricted to a hardcoded subset (e.g. Qwen only).
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
// Keep a discovered catalog for ten minutes before refetching.
const TTL = 10 * 60 * 1000;
import { parseOpenRouterCatalog } from '@kenkaiiii/gg-core';

let cache = { models: null, at: 0 };

/** Fetch and parse OpenRouter's model catalog. Throws on network or auth failure. */
export async function discoverOpenRouterModels(apiKey, { signal } = {}) {
  if (!apiKey || typeof apiKey !== 'string') throw new Error('openrouter_api_key_missing');
  const now = Date.now();
  if (cache.models && now - cache.at < TTL) return cache.models.slice();
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      signal,
    });
    if (res.status === 401 || res.status === 403) throw new Error('openrouter_invalid_key');
    if (!res.ok) throw new Error(`openrouter_${res.status}`);
    const data = await res.json();
    // Use gg-core's canonical parser: it filters models without tool calling and
    // maps context, output limits, capabilities, and reasoning into ModelInfo.
    const list = parseOpenRouterCatalog(data).models;
    cache = { models: list, at: now };
    return list.slice();
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (msg === 'openrouter_invalid_key' || msg === 'openrouter_api_key_missing') throw e;
    if (msg.startsWith('openrouter_')) throw e;
    throw new Error('openrouter_network');
  }
}

/** Drop the cached catalog so the next discovery refetches from the API. */
export function clearOpenRouterCache() {
  cache = { models: null, at: 0 };
}
