// The talk key, in one place: whether it listens right now, and every word the panel shows about it. The sidekick
// decides with this and sends the sentences in the panel's state; the panel only displays them, so the two can't
// drift apart. Keys are F1-F24, and the shell registers one only while it can actually open the mic (`usable`).

/**
 * @param {{ key?: string, voiceOn?: boolean, ready?: boolean, error?: string, hotkeys?: boolean, hold?: string }} o
 *   key: the saved function key ('' for none). voiceOn/ready: voice control and its speech model. error: a key the
 *   shell refused (another app owns it). hotkeys: the shell can have global shortcuts (false on Wayland). hold: the
 *   modifier keys as the panel writes them, e.g. "⌃⌥".
 * @returns {{ usable: boolean, locked: boolean, hint: string, summary: string, holdHint: string }}
 *   usable: the shell holds the key and pressing it listens. locked: the key can't be changed right now (voice off,
 *   no speech model, or a key the shell refused), so the panel disables its button and shows `hint` as the reason;
 *   Clear stays available, so a refused key can be dropped to pick another. hint: the line under "Talk key".
 *   summary: the Voice page's one-line "how you talk". holdHint: the line under "Hold to talk".
 */
export const talkKeyState = ({ key = '', voiceOn = false, ready = false, error = '', hotkeys = false, hold = '' } = {}) => {
  const blocked = !voiceOn || !ready;
  const usable = hotkeys && !blocked && !error && !!key;
  // A refused key blocks changing it (the shell would refuse the same one again); Clear is how it gets replaced.
  const locked = blocked || !!error;
  const hint = !voiceOn ? 'Turn on Voice control first.'
    : !ready ? 'Download the voice model first.'
      : error ? `Another app already uses ${error}. Clear it to pick another key.`
        : !hotkeys ? (key ? `In your desktop's Keyboard Shortcuts settings, bind ${key} to “Talk to me” below.` : 'On Wayland, choose a key in your desktop Keyboard Shortcuts settings and bind it to “Talk to me” below.')
          : key ? `Press ${key} to start listening; press again or pause to send.`
            : 'Choose a function key to start listening hands-free; press again or pause to send.';
  // Voice off is a state, not an instruction: the switch is off, so say what that means rather than "hold the keys".
  const summary = !voiceOn ? 'Off: the mic stays closed'
    : usable ? `Press ${key} to listen, then press again or pause to send`
      : !hotkeys && key ? `Bind ${key} to Talk to me in Keyboard settings`
        : hotkeys && hold ? `Hold ${hold} to talk`
          : 'Press your talk shortcut to talk';
  // The hold line follows the same state: with voice off or no speech model, holding the keys does nothing either.
  const holdHint = !voiceOn ? 'Needs Voice control on'
    : !ready ? 'Needs the voice model'
      : hotkeys && hold ? `Hold ${hold} while speaking, or tap it to listen hands-free.`
        : 'Use the Talk to me desktop shortcut below to start listening.';
  return { usable, locked, hint, summary, holdHint };
};
