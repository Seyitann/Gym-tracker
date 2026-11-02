let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

// Call from a tap handler (e.g. START) so phones allow sound later when a timer ends
export function unlockAudio() {
  const c = getContext();
  if (c && c.state === "suspended") void c.resume();
}

export function playBeep() {
  try {
    const c = getContext();
    if (!c) return;
    const oscillator = c.createOscillator();
    const gain = c.createGain();
    oscillator.connect(gain);
    gain.connect(c.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, c.currentTime);
    oscillator.start();
    oscillator.stop(c.currentTime + 0.3);
  } catch (err) {
    console.error("Could not play sound", err);
  }
}
