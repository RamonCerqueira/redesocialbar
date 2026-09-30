import type { Metadata, Viewport } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AppShell } from '@/components/app-shell';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tô no Piramba - Eu estou aqui. Você está aqui.',
  description:
    'Rede social exclusiva conectada à experiência física do Restaurante Pirambeira em Salvador, BA. Descubra quem está aqui agora, participe do mural da paquera, encontros e promoções.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/pirambeira-favicon.ico',
    shortcut: '/pirambeira-favicon.ico',
    apple: '/LogoPirambeiraSemFundo.png',
  },
  keywords: ['bar', 'restaurante', 'pirambeira', 'salvador', 'pituba', 'rede social', 'paquera', 'chopp', 'ao vivo'],
  authors: [{ name: 'Equipe Tô no Piramba' }],
  openGraph: {
    title: 'Tô no Piramba - O que está rolando agora?',
    description: 'A rede social exclusiva do Restaurante Pirambeira na Pituba, Salvador.',
    url: process.env.NEXT_PUBLIC_APP_URL || undefined,
    siteName: 'Tô no Piramba',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#080706',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="bg-[#080807] text-[#FFFFFF] min-h-screen selection:bg-[#FFB800]/30 selection:text-[#FFB800]">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
