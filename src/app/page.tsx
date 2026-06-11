import Link from 'next/link';
import {
  ArrowRight, Dumbbell, Camera, CheckCircle2,
} from 'lucide-react';
import { PRECISION_THRESHOLD } from '@/types/poseflow';

const MODULE1_FEATURES = [
  'Sube imágenes JPG/PNG de poses (1–20 por ejercicio)',
  'MediaPipe extrae 33 landmarks 3D en modo IMAGE',
  'Calcula ángulos articulares automáticamente',
  'Configura tiempo de pose (5–120 s) y transición (1–10 s)',
  'Genera JSON exportable para el Módulo 2',
  'CRUD completo de ejercicios',
];

const MODULE2_FEATURES = [
  'Activación de webcam con permisos del navegador',
  'Detección en tiempo real a ≥ 15 FPS',
  'Comparación frame‑a‑frame vs. referencia del instructor',
  `Score dinámico 0–100 % con umbral de ${PRECISION_THRESHOLD} %`,
  'Overlay verde / amarillo / rojo por articulación',
  'Beeps de transición (Web Audio API) + temporizador',
  'Reporte post‑sesión con gráficas',
];


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative container max-w-5xl mx-auto px-4 pt-20 pb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tight mb-5">
            Fisic
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Tech
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Plataforma de entrenamiento inteligente de pilates con detección de poses en tiempo real mediante visión por computadora.
          </p>

          {/* CTA buttons — área previamente marcada con plumón */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/evaluation"
              className="group inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
            >
              <Camera className="w-4 h-4" strokeWidth={2} />
              Módulo de Alumnos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>

            <Link
              href="/training"
              className="inline-flex items-center gap-2.5 bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.04] text-gray-200 font-semibold px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              <Dumbbell className="w-4 h-4" strokeWidth={2} />
              Módulo de Lecciones
            </Link>
          </div>

        </div>
      </section>

      {/* ── 4 poses de demo ───────────────────────────────────── */}
      <section className="container max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">
            Ejercicio de demo &middot; Módulo 1 ya cargado
          </p>
          <h2 className="text-2xl font-bold text-white">Apertura de Brazos (Pilates)</h2>
          <p className="text-gray-500 text-sm mt-1">
            4 poses de referencia &middot; posición supina &middot; {PRECISION_THRESHOLD} % umbral de precisión
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="group space-y-2">
              <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/[0.06] ring-1 ring-white/[0.04] group-hover:border-blue-500/40 transition-colors duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/pilates-pose-${n}.png`}
                  alt={`Pose ${n}`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <p className="text-center text-xs text-gray-500 font-medium">Pose {n}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300/80 text-center leading-relaxed">
          Las imágenes están cargadas. Para generar landmarks y ángulos reales,
          procésalas en el <strong className="text-blue-300">Módulo de Lecciones</strong>.
          El JSON resultante alimentará el <strong className="text-blue-300">Módulo de Alumnos</strong>.
        </div>
      </section>

      {/* ── Tarjetas de módulos ───────────────────────────────── */}
      <section className="container max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Módulo 1 */}
          <Link
            href="/training"
            className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/30 p-6 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider">Módulo 1</p>
                <h3 className="text-lg font-bold text-white leading-tight">Lecciones — Instructor</h3>
              </div>
            </div>

            <ul className="space-y-2 flex-1">
              {MODULE1_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1.5 mt-5 text-sm text-violet-400 group-hover:text-violet-300 font-medium transition-colors duration-200">
              Procesar las 4 imágenes de pilates
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          </Link>

          {/* Módulo 2 */}
          <Link
            href="/evaluation"
            className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-500/30 p-6 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Módulo 2</p>
                <h3 className="text-lg font-bold text-white leading-tight">Evaluación — Alumno</h3>
              </div>
            </div>

            <ul className="space-y-2 flex-1">
              {MODULE2_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1.5 mt-5 text-sm text-blue-400 group-hover:text-blue-300 font-medium transition-colors duration-200">
              Probar con el ejercicio de demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
