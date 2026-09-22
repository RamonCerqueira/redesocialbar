import type { Metadata, Viewport } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Header } from '@/components/header';
import { SplashScreen } from '@/components/splash-screen';

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
    url: 'https://tonopiramba.com.br',
    siteName: 'Tô no Piramba',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#080706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <SplashScreen />
          <div className="flex min-h-screen">

            <Navigation />
            <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 w-full max-w-[430px] lg:max-w-2xl mx-auto min-w-0 lg:py-6 lg:px-4">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
