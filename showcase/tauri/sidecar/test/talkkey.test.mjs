// The talk key's states and the exact words each one puts in the panel (talkkey.mjs). Run: npm test
import assert from 'node:assert/strict';
import { talkKeyState } from '../talkkey.mjs';

const base = { key: 'F8', voiceOn: true, ready: true, error: '', hotkeys: true, hold: '⌃⌥' };
const state = (over) => talkKeyState({ ...base, ...over });

// One row per state. Each row changes a single input, so flipping any one condition in talkkey.mjs fails here.
const rows = [
  ['it works', {}, {
    usable: true, locked: false,
    hint: 'Press F8 to start listening; press again or pause to send.',
    summary: 'Press F8 to listen, then press again or pause to send',
  }],
  ['voice is off', { voiceOn: false }, {
    usable: false, locked: true,
    hint: 'Turn on Voice control first.',
    summary: 'Off: the mic stays closed', holdHint: 'Needs Voice control on',
  }],
  ['the speech model is missing', { ready: false }, {
    usable: false, locked: true,
    hint: 'Download the voice model first.',
    summary: 'Hold ⌃⌥ to talk', holdHint: 'Needs the voice model',
  }],
  ['another app owns the key', { error: 'F8' }, {
    usable: false, locked: true,
    hint: 'Another app already uses F8. Clear it to pick another key.',
    summary: 'Hold ⌃⌥ to talk',
  }],
  ['no key yet', { key: '' }, {
    usable: false, locked: false,
    hint: 'Choose a function key to start listening hands-free; press again or pause to send.',
    summary: 'Hold ⌃⌥ to talk',
  }],
  ['Wayland, a key picked', { hotkeys: false }, {
    usable: false, locked: false,
    hint: 'In your desktop\'s Keyboard Shortcuts settings, bind F8 to “Talk to me” below.',
    summary: 'Bind F8 to Talk to me in Keyboard settings',
  }],
  ['Wayland, no key yet', { hotkeys: false, key: '' }, {
    usable: false, locked: false,
    hint: 'On Wayland, choose a key in your desktop Keyboard Shortcuts settings and bind it to “Talk to me” below.',
    summary: 'Press your talk shortcut to talk',
  }],
];
for (const [name, over, want] of rows) {
  const got = state(over);
  for (const [field, value] of Object.entries(want)) assert.deepEqual(got[field], value, `${name}: ${field}`);
}

// The hold line follows the platform: the chord where shortcuts work, the desktop command where they don't.
assert.equal(state({}).holdHint, 'Hold ⌃⌥ while speaking, or tap it to listen hands-free.');
assert.equal(state({ hotkeys: false }).holdHint, 'Use the Talk to me desktop shortcut below to start listening.');
assert.equal(state({ hold: '' }).holdHint, 'Use the Talk to me desktop shortcut below to start listening.');
// And it never promises a chord that would do nothing: no "Hold" once voice or its model is missing.
for (const over of [{ voiceOn: false }, { ready: false }]) {
  assert.ok(!/Hold/.test(state(over).holdHint), 'no hold promise while it cannot listen');
}

// The button is off exactly when a press would explain nothing: off, no model, rejected key. Not for states a click fixes.
for (const [over, want] of [[{}, false], [{ key: '' }, false], [{ error: 'F8' }, true], [{ voiceOn: false }, true], [{ ready: false }, true]]) {
  assert.equal(state(over).locked, want, JSON.stringify(over));
}
// Clearing a rejected key unlocks the button, so the fix is always reachable.
assert.equal(state({ error: '', key: '' }).locked, false);
assert.equal(state({ error: '', key: '' }).usable, false);

// Nothing claims a press that does nothing: every not-usable state says so instead of "Press F8 to listen".
for (const over of [{ voiceOn: false }, { ready: false }, { error: 'F8' }, { hotkeys: false }, { key: '' }]) {
  assert.equal(state(over).usable, false);
  assert.ok(!/^Press F8 to listen/.test(state(over).summary), 'no press claim while it cannot listen');
}

console.log('talkkey tests: passed');
