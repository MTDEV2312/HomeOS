import type { Metadata, Viewport } from 'next';
import { Manrope, DM_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/lib/auth-context';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://homeos.mathiast.me'),
  title: {
    default: 'HomeOS — Sistema operativo para el hogar',
    template: '%s — HomeOS',
  },
  description: 'Todo lo que mantiene tu hogar en marcha, en un solo lugar.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://homeos.mathiast.me',
    title: 'HomeOS — Sistema operativo para el hogar',
    description: 'Todo lo que mantiene tu hogar en marcha, en un solo lugar.',
    siteName: 'HomeOS',
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'HomeOS Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeOS — Sistema operativo para el hogar',
    description: 'Todo lo que mantiene tu hogar en marcha, en un solo lugar.',
    creator: '@MTDEV2312',
    images: ['/images/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${manrope.variable} ${dmMono.variable}`}>
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('homeos-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||((!t||t==='system')&&m)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-bg dark:bg-dark-bg text-ink dark:text-dark-ink font-sans antialiased selection:bg-olive selection:text-white dark:selection:bg-dark-olive dark:selection:text-dark-bg"
      >
        <ThemeProvider>
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
