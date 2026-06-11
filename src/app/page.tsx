'use client';

import { Button } from '@/components/ui/button';
import { useExampleStore } from '@/stores/example-store';
import { useExample } from '@/hooks/use-example';

export default function Home() {
  const { count, increment, decrement, reset } = useExampleStore();
  const { value, updateValue, isLoading } = useExample('Hola Mundo');

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              Bienvenido a{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EDUC FISICA
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Una plataforma moderna para la educación física desarrollada con las mejores
              tecnologías web.
            </p>
            <div className="space-x-4">
              <Button size="lg">Comenzar</Button>
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Características
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Este proyecto incluye todo lo necesario para desarrollar aplicaciones modernas.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Next.js 15</h3>
                  <p className="text-sm text-muted-foreground">
                    App Router, Layouts, Loading UI y API routes.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">React 18</h3>
                  <p className="text-sm text-muted-foreground">
                    Server y Client Components. Usa hooks y suspense.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Tailwind CSS</h3>
                  <p className="text-sm text-muted-foreground">
                    Framework de utilidades CSS para diseño rápido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Demo Interactiva
            </h2>
            <div className="space-y-4 p-8 border rounded-lg bg-card">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Contador con Zustand</h3>
                <p className="text-lg">Valor actual: {count}</p>
                <div className="space-x-2">
                  <Button onClick={increment}>Incrementar</Button>
                  <Button onClick={decrement} variant="outline">
                    Decrementar
                  </Button>
                  <Button onClick={reset} variant="destructive">
                    Reset
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Hook Personalizado</h3>
                <p className="text-lg">Estado: {isLoading ? 'Cargando...' : value}</p>
                <Button 
                  onClick={() => updateValue('¡Estado actualizado!')}
                  disabled={isLoading}
                >
                  Actualizar Estado
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
