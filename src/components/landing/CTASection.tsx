"use client";

import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative py-24 px-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-container-low to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-max_width mx-auto">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-xl sm:p-2xl text-center flex flex-col items-center gap-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0px_4px_20px_rgba(0,0,0,0.3)]">
          <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">
              home
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-on-background">
            Organiza tu hogar hoy
          </h2>

          <p className="text-on-surface-variant text-lg max-w-xl">
            Únete a las familias que ya gestionan su hogar de forma inteligente.
            Gratis para empezar.
          </p>

          <div className="flex flex-wrap gap-md mt-sm">
            <Link
              href="/signup"
              className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Crear mi hogar gratis
            </Link>
            <Link
              href="/login"
              className="border border-outline text-on-surface px-xl py-md rounded-lg font-label-md hover:bg-surface-container-high transition-all duration-200 active:scale-[0.98]"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
