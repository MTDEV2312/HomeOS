import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="error-grid-bg" />
      <div className="error-shape error-shape-primary" />
      <div className="error-shape error-shape-secondary" />
      <div className="error-shape error-shape-accent" />

      <div className="error-geo-ring">
        <div className="error-geo-ring-inner" />
      </div>

      <div className="error-geo-dots">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="error-geo-line-v" />
      <div className="error-geo-line-h" />

      <main className="relative z-10 text-center px-6 max-w-[600px]">
        <div className="error-code-text" aria-hidden="true">
          <span className="sr-only">404</span>
          <span className="error-code-fill">404</span>
        </div>

        <h1 className="font-h1 text-h1 text-on-surface mt-8 mb-3">
          Esta página se perdió en el camino
        </h1>

        <p className="font-body-lg text-on-surface-variant max-w-[380px] mx-auto leading-relaxed">
          Lo sentimos, la página que buscas no existe o fue movida.
          Volvamos a la seguridad de tu hogar.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-xl">
              home
            </span>
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
