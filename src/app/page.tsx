import Link from 'next/link';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: '🎓',
    title: 'Entrenamiento',
    description:
      'Captura poses de referencia con tu cámara. MediaPipe extrae los 33 landmarks del cuerpo y calcula ángulos articulares automáticamente.',
    href: '/training',
    color: 'border-purple-700 hover:border-purple-500',
    badge: 'Para maestros',
  },
  {
    icon: '📷',
    title: 'Evaluación en Tiempo Real',
    description:
      'Compara tu pose con la referencia del maestro. Retroalimentación visual inmediata con puntuación por articulación.',
    href: '/evaluation',
    color: 'border-blue-700 hover:border-blue-500',
    badge: 'Para estudiantes',
  },
  {
    icon: '📊',
    title: 'Historial de Sesiones',
    description:
      'Visualiza el progreso a lo largo del tiempo. Gráficas de evolución del score y estadísticas detalladas por articulación.',
    href: '/sessions',
    color: 'border-green-700 hover:border-green-500',
    badge: 'Seguimiento',
  },
];

const TECH_STACK = [
  { label: 'MediaPipe Pose Landmarker', description: '33 landmarks 3D en tiempo real (~35ms/frame)' },
  { label: 'WebAssembly + WebGL', description: 'Procesamiento 100% en el navegador, sin servidores de video' },
  { label: 'Next.js 15 + TypeScript', description: 'App Router, Server Components, tipado estricto' },
  { label: 'Comparación de Poses', description: 'Ángulos articulares + similitud euclidiana normalizada' },
  { label: 'FastAPI Backend', description: 'API REST para persistencia de poses y sesiones' },
  { label: 'Privacidad por Diseño', description: 'El video nunca sale del dispositivo del usuario' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="container max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-800 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          Powered by MediaPipe · Procesamiento en tiempo real
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Evaluación de Poses
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            con Inteligencia Artificial
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Plataforma de educación física que usa visión por computadora para
          detectar, comparar y evaluar poses de pilates y yoga en tiempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/evaluation">Iniciar Evaluación →</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/training">Crear Poses de Referencia</Link>
          </Button>
        </div>
      </section>

      {/* Módulos */}
      <section className="container max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(feature => (
            <Link
              key={feature.href}
              href={feature.href}
              className={`block rounded-2xl border bg-gray-900 p-6 transition-all duration-200 ${feature.color}`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{feature.icon}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="container max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-200">
          Arquitectura Técnica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECH_STACK.map((item, i) => (
            <div
              key={i}
              className="bg-gray-900 rounded-xl border border-gray-800 p-4"
            >
              <p className="font-semibold text-white text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline visual */}
      <section className="container max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h3 className="text-lg font-bold text-center mb-6 text-gray-200">
            Flujo de Evaluación
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center text-sm">
            {[
              { icon: '📸', label: 'Captura de Referencia', sub: 'Maestro graba pose' },
              { icon: '🤖', label: 'MediaPipe Detecta', sub: '33 landmarks 3D' },
              { icon: '📐', label: 'Cálculo de Ángulos', sub: '11 articulaciones' },
              { icon: '⚡', label: 'Comparación Live', sub: '~35ms por frame' },
              { icon: '🎯', label: 'Feedback Visual', sub: 'Verde/Amarillo/Rojo' },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-gray-500 text-xs">{item.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-gray-600 text-xl hidden md:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
