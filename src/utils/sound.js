let ctx = null;
function getCtx() {
  if (ctx && ctx.state !== 'closed') return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  return ctx;
}
function toneFor(kind) {
  if (kind === 'order') return { f: 880, d: 0.15, g: 0.15 };
  if (kind === 'adminMsg') return { f: 740, d: 0.12, g: 0.12 };
  if (kind === 'adminOrder') return { f: 660, d: 0.15, g: 0.15 };
  return { f: 520, d: 0.1, g: 0.1 };
}
export function playSound(kind = 'chat') {
  const audio = getCtx();
  if (!audio) return;
  const { f, d, g } = toneFor(kind);
  try {
    const now = audio.currentTime + 0.01;
    const o = audio.createOscillator();
    const gain = audio.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(g, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(gain);
    gain.connect(audio.destination);
    o.start(now);
    o.stop(now + d + 0.02);
    if (audio.state === 'suspended') audio.resume().catch(() => {});
  } catch {}
}
