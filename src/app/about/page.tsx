export default function About() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Acerca de EDUC FISICA
        </h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Una plataforma educativa moderna diseñada para revolucionar la enseñanza de la educación física.
        </p>
        <div className="max-w-4xl space-y-6 text-left">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Nuestra Misión</h2>
            <p className="text-muted-foreground">
              Transformar la educación física mediante tecnología innovadora, proporcionando herramientas
              digitales que mejoren el aprendizaje, seguimiento y evaluación de actividades deportivas.
            </p>
          </section>
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Tecnologías Utilizadas</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
              <li>• Next.js 15 - Framework de React</li>
              <li>• TypeScript - Tipado estático</li>
              <li>• Tailwind CSS - Estilos utilitarios</li>
              <li>• Zustand - Gestión de estado</li>
              <li>• TanStack Query - Manejo de datos</li>
              <li>• ESLint & Prettier - Calidad de código</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}