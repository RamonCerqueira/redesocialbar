/**
 * Sintetizador acústico de áudio para microinteração de Brinde (Tilintar de Copos)
 * Utiliza Web Audio API nativa com harmônicos puros sem necessidade de arquivos externos.
 */
export function playGlassClinkSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Se estiver suspenso pelo navegador aguardando interação do usuário, resume
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 1º Harmônico: Tom do vidro cristalino (~2150Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2150, now);
    osc1.frequency.exponentialRampToValueAtTime(1980, now + 0.18);

    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // 2º Harmônico: Ressonância aguda do choque (~3400Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3400, now);
    osc2.frequency.exponentialRampToValueAtTime(3100, now + 0.08);

    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // 3º Harmônico sutil: Toque de reverberação
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(4200, now);

    gain3.gain.setValueAtTime(0.08, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 0.3);
    osc2.stop(now + 0.15);
    osc3.stop(now + 0.06);
  } catch {
    // Falha silenciosa em navegadores com áudio bloqueado
  }
}
