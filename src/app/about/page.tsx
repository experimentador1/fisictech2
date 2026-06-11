import { Activity, Camera, Dumbbell, BarChart2, Zap, ShieldCheck, Brain } from 'lucide-react';

const STACK = [
  { label: 'Next.js 15', desc: 'Framework React con App Router' },
  { label: 'TypeScript', desc: 'Tipado estático estricto' },
  { label: 'MediaPipe', desc: 'Detección de poses en tiempo real (33 landmarks 3D)' },
  { label: 'Tailwind CSS', desc: 'Estilos utilitarios y dark mode' },
  { label: 'Zustand', desc: 'Gestión de estado global con persistencia' },
  { label: 'Recharts', desc: 'Visualización de métricas y reportes' },
];

const MODULES = [
  {
    icon: Dumbbell,
    title: 'Módulo 1 — Lecciones',
    desc: 'El instructor sube imágenes de poses de referencia. MediaPipe extrae 33 landmarks 3D y calcula ángulos articulares. El resultado se exporta como JSON para cargar en el Módulo 2.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Camera,
    title: 'Módulo 2 — Evaluación',
    desc: 'El alumno activa su cámara y realiza la secuencia de poses. La aplicación compara en tiempo real los ángulos del alumno vs. los de referencia y emite retroalimentación visual y sonora.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: BarChart2,
    title: 'Historial de Sesiones',
    desc: 'Cada sesión queda registrada con score global, score por pose, repeticiones completadas y gráficas de evolución para seguimiento del progreso del alumno.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
];

const FEATURES = [
  { icon: Zap,        label: 'Procesamiento 100% en el cliente', desc: 'Sin servidores GPU. Todo corre en el navegador con WebAssembly.' },
  { icon: ShieldCheck,label: 'Umbral de precisión configurable', desc: 'Por defecto 85 %. Tolerancias por articulación ajustables.' },
  { icon: Brain,      label: 'Feedback multimodal', desc: 'Colores, texto y tonos de audio según el nivel de precisión alcanzado.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-16">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 items-center justify-center shadow-xl shadow-blue-500/20 mx-auto">
            <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black">
            Acerca de <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">FisicTech</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Plataforma de entrenamiento inteligente de pilates con detección de poses en tiempo real
            mediante visión por computadora. Diseñada para instructores y alumnos.
          </p>
        </div>

        {/* Módulos */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Cómo funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODULES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className={`rounded-xl border p-5 space-y-3 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
                <h3 className="font-bold text-sm text-white">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Características clave */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Características clave</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5 space-y-2">
                <Icon className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stack tecnológico */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Stack tecnológico</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {STACK.map(({ label, desc }) => (
              <div key={label} className="bg-white/[0.02] rounded-lg border border-white/[0.06] px-4 py-3">
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
