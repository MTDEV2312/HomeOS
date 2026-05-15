import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

import { ToastProvider } from "@/lib/toast-context";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <title>HomeOS - Gestión familiar integrada</title>
        <meta name="description" content="HomeOS - Tu mini ERP familiar para gestión del hogar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/logo.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
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
