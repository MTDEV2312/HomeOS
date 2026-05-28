"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/50">
      <div className="max-w-max_width mx-auto flex items-center justify-between px-lg h-16">
        <Link href="/" className="flex items-center gap-sm group">
          <Logo size={32} className="text-primary" />
          <span className="font-h3 font-bold text-on-background group-hover:text-primary transition-colors duration-200">
            HomeOS
          </span>
        </Link>
        <div className="flex items-center gap-md">
          <a
            href="#features"
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md hidden sm:block"
          >
            Características
          </a>
          <Link
            href="/dashboard"
            className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Abrir Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
