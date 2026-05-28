"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container-low py-xl px-lg">
      <div className="max-w-max_width mx-auto flex flex-col sm:flex-row items-center justify-between gap-lg">
        <div className="flex items-center gap-sm">
          <Logo size={24} className="text-primary" />
          <span className="font-label-md text-on-surface-variant">
            HomeOS
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-lg">
          <Link
            href="/login"
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-sm"
          >
            Registrarse
          </Link>
          <Link
            href="/terms"
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-sm"
          >
            Términos
          </Link>
          <Link
            href="/privacy"
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-sm"
          >
            Privacidad
          </Link>
          <Link
            href="/help"
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-sm"
          >
            Ayuda
          </Link>
        </div>

        <p className="text-on-surface-variant font-label-sm">© 2025 HomeOS</p>
      </div>
    </footer>
  );
}
