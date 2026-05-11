import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>HomeOS - Gestión familiar integrada</title>
        <meta name="description" content="HomeOS - Tu mini ERP familiar para gestión del hogar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-background text-on-background font-body-md text-body-md antialiased overflow-hidden flex flex-col h-screen transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
