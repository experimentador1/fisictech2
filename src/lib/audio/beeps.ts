'use client';

/**
 * Web Audio API - Señales auditivas para FisicTech
 *
 * Tres tipos de beeps:
 *  - countdown: tic durante cuenta regresiva (3-2-1)
 *  - transition: señal de cambio de pose (doble tono)
 *  - correct: confirmación de pose correcta (tono agradable)
 *  - start: inicio de sesión (ascendente)
 *  - end: fin de sesión (descendente)
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  gain = 0.4,
  type: OscillatorType = 'sine',
  startOffset = 0
): void {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.value = frequency;
  gainNode.gain.setValueAtTime(0, ctx.currentTime + startOffset);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startOffset + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration + 0.05);
}

/** Tic de cuenta regresiva (3, 2, 1) */
export function playCountdown(): void {
  playTone(880, 0.15, 0.3, 'sine');
}

/** Último tic antes de comenzar */
export function playCountdownFinal(): void {
  playTone(1100, 0.2, 0.5, 'sine');
}

/** Transición entre poses (2 tonos rápidos) */
export function playTransition(): void {
  playTone(660, 0.12, 0.4, 'square');
  playTone(880, 0.12, 0.4, 'square', 0.15);
}

/** Pose detectada como correcta (tono suave positivo) */
export function playCorrect(): void {
  playTone(523, 0.1, 0.25, 'sine');   // C5
  playTone(659, 0.1, 0.25, 'sine', 0.12);   // E5
  playTone(784, 0.15, 0.25, 'sine', 0.24);  // G5
}

/** Inicio de sesión */
export function playSessionStart(): void {
  [440, 550, 660, 880].forEach((freq, i) => {
    playTone(freq, 0.15, 0.35, 'sine', i * 0.12);
  });
}

/** Fin de sesión */
export function playSessionEnd(): void {
  [880, 660, 550, 440].forEach((freq, i) => {
    playTone(freq, 0.2, 0.35, 'sine', i * 0.15);
  });
}

/** Advertencia (pose incorrecta por mucho tiempo) */
export function playWarning(): void {
  playTone(330, 0.3, 0.3, 'sawtooth');
}

/** Resume el AudioContext si está suspendido (requerido por Chrome tras interacción del usuario) */
export function resumeAudio(): void {
  getContext().resume().catch(() => {});
}
