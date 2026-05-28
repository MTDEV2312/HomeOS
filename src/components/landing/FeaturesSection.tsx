"use client";

import { FeatureCard } from "./FeatureCard";

const features = [
  {
    icon: "check_circle",
    title: "Tareas",
    description:
      "Organiza y asigna tareas del hogar con prioridades, fechas de vencimiento y recurrencia automática.",
    color: "#0284c7",
    containerColor: "#e0f2fe",
  },
  {
    icon: "shopping_cart",
    title: "Compras",
    description:
      "Listas de compras colaborativas en tiempo real. Marca artículos mientras otros los encuentran.",
    color: "#d97706",
    containerColor: "#fef3c7",
  },
  {
    icon: "account_balance_wallet",
    title: "Gastos",
    description:
      "Registra gastos compartidos, establece presupuestos mensuales y visualiza tu flujo de dinero.",
    color: "#e11d48",
    containerColor: "#ffe4e6",
  },
  {
    icon: "inventory_2",
    title: "Inventario",
    description:
      "Lleva el control del stock de tu hogar. Alertas automáticas cuando un producto está por agotarse.",
    color: "#059669",
    containerColor: "#d1fae5",
  },
  {
    icon: "build",
    title: "Mantenimiento",
    description:
      "Programa mantenimientos preventivos para electrodomésticos y registra el historial de cada activo.",
    color: "#0d9488",
    containerColor: "#ccfbf1",
  },
  {
    icon: "folder",
    title: "Documentos",
    description:
      "Almacena garantías, contratos, recibos y documentos importantes. Accesibles desde cualquier lugar.",
    color: "#4f46e5",
    containerColor: "#e0e7ff",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-lg">
      <div className="max-w-max_width mx-auto">
        <div className="flex flex-col items-center gap-md mb-16">
          <span className="font-label-sm text-primary tracking-wider uppercase">
            Características
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-on-background text-center">
            Todo lo que tu hogar necesita
          </h2>
          <p className="text-on-surface-variant text-lg text-center max-w-2xl mt-sm">
            Un sistema integrado que centraliza la gestión de tu hogar.
            Colabora con tu familia en cada detalle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
