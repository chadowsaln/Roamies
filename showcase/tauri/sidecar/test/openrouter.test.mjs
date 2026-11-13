// OpenRouter model discovery tests. Run: node test/openrouter.test.mjs
import assert from 'node:assert/strict';
import { discoverOpenRouterModels, clearOpenRouterCache } from '../openrouter.mjs';

// Reset the cache between tests.
clearOpenRouterCache();

{
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/models');
    assert.ok(opts.headers.Authorization.startsWith('Bearer '));
    return { status: 200, ok: true, json: async () => ({
      data: [
        { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', context_length: 32768, supported_parameters: ['tools'], pricing: { prompt: '0.0001' } },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context_length: 200000, supported_parameters: ['tools'] },
        { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', context_length: null, supported_parameters: ['tools'] },
        { id: 'provider/no-tools', name: 'No tools', context_length: 32768, supported_parameters: [] },
      ],
    }) };
  };
  try {
    const models = await discoverOpenRouterModels('sk-or-v1-test');
    assert.equal(models.length, 2, 'models without tool support or a context window are excluded');
    assert.equal(models[0].id, 'qwen/qwen3-32b');
    assert.equal(models[0].provider, 'openrouter');
    assert.equal(models[0].contextWindow, 32768);
    assert.equal(models[0].maxOutputTokens, 16384);
    assert.equal(models[1].name, 'Claude 3.5 Sonnet');
    // Cached: second call returns the same objects without refetching.
    let calls = 0;
    const spy = global.fetch;
    global.fetch = async () => { calls++; return realFetch ? realFetch('https://example.com', {}) : { status: 200, ok: true, json: async () => ({ data: [] }) }; };
    await discoverOpenRouterModels('sk-or-v1-test');
    assert.equal(calls, 0, 'cache hit should not fetch again');
    global.fetch = spy;
  } finally { global.fetch = realFetch; clearOpenRouterCache(); }
  console.log('discovery ok');
}

{
  const realFetch = global.fetch;
  global.fetch = async () => ({ status: 401, ok: false });
  try {
    await assert.rejects(() => discoverOpenRouterModels('bad-key'), /openrouter_invalid_key/);
  } finally { global.fetch = realFetch; clearOpenRouterCache(); }
  console.log('invalid key ok');
}

{
  const realFetch = global.fetch;
  global.fetch = async () => { throw new Error('ENOTFOUND'); };
  try {
    await assert.rejects(() => discoverOpenRouterModels('sk-or-v1-test'), /openrouter_network/);
  } finally { global.fetch = realFetch; clearOpenRouterCache(); }
  console.log('network ok');
}

{
  const realFetch = global.fetch;
  global.fetch = async () => ({ status: 200, ok: true, json: async () => ({ data: [] }) });
  try {
    const models = await discoverOpenRouterModels('sk-or-v1-test');
    assert.equal(models.length, 0);
  } finally { global.fetch = realFetch; clearOpenRouterCache(); }
  console.log('empty ok');
}

console.log('openrouter ok');
