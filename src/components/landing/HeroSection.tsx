"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const ThreeHouse = dynamic(
  () => import("./ThreeHouse").then((mod) => ({ default: mod.ThreeHouse })),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-container-low" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl" />

      <div className="relative max-w-max_width mx-auto px-lg w-full grid grid-cols-1 lg:grid-cols-2 gap-xl items-center pt-24 pb-12 lg:pb-24">
        <div className="flex flex-col gap-lg z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-on-background leading-tight tracking-tight">
            Tu hogar,{" "}
            <span className="text-primary">organizado</span> e{" "}
            <span className="text-tertiary">integrado</span>
          </h1>

          <div className="inline-flex items-center gap-sm bg-primary-container self-start px-md py-sm rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-sm text-on-primary-container">
              Mini ERP Familiar
            </span>
          </div>

          <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
            Gestiona tareas, presupuestos, compras, inventario y mantenimiento
            de tu hogar en un solo lugar. Colabora con tu familia en tiempo
            real.
          </p>

          <div className="flex flex-wrap gap-md mt-sm">
            <Link
              href="/signup"
              className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] text-center"
            >
              Comenzar gratis
            </Link>
            <Link
              href="/login"
              className="border border-outline text-on-surface px-xl py-md rounded-lg font-label-md hover:bg-surface-container-high transition-all duration-200 active:scale-[0.98] text-center"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="flex flex-wrap gap-sm mt-md">
            {["Tareas", "Compras", "Gastos", "Inventario", "Docs"].map(
              (feature) => (
                <span
                  key={feature}
                  className="bg-surface-container-high/50 text-on-surface-variant px-md py-xs rounded-full font-label-sm border border-outline-variant/30"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>

        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[550px] order-first lg:order-last">
          <ThreeHouse />
        </div>
      </div>
    </section>
  );
}
