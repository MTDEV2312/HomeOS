import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import { ToastProvider } from "@/lib/toast-context";
import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://homeos.mathiast.me"),
  title: {
    default: "HomeOS - Gestión familiar integrada",
    template: "%s - HomeOS",
  },
  description: "HomeOS - Tu mini ERP familiar para la gestión del hogar, tareas, presupuestos y compras colaborativas.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://homeos.mathiast.me",
    title: "HomeOS - Gestión familiar integrada",
    description: "HomeOS - Tu mini ERP familiar para la gestión del hogar, tareas, presupuestos y compras colaborativas.",
    siteName: "HomeOS",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "HomeOS Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeOS - Gestión familiar integrada",
    description: "HomeOS - Tu mini ERP familiar para la gestión del hogar, tareas, presupuestos y compras colaborativas.",
    creator: "@MTDEV2312",
    images: ["/images/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/images/logo.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body suppressHydrationWarning className="bg-background text-on-background font-body-md text-body-md antialiased overflow-hidden flex flex-col h-screen transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
