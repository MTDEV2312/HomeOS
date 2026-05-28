"use client";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  containerColor: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  color,
  containerColor,
}: FeatureCardProps) {
  return (
    <div className="group relative bg-surface-container-lowest rounded-xl border border-outline-variant p-lg hover:shadow-[0px_4px_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0px_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-outline overflow-hidden">
      <div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ backgroundColor: `${containerColor}40` }}
      />

      <div className="relative flex flex-col gap-md">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: containerColor }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color }}
          >
            {icon}
          </span>
        </div>

        <h3 className="font-h3 font-semibold text-on-background">{title}</h3>

        <p className="text-on-surface-variant font-body-md leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
