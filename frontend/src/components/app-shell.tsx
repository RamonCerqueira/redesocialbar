'use client';
import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { Header } from './header';
import { SplashScreen } from './splash-screen';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;
  return <>
    <SplashScreen />
    <div className="flex min-h-screen">
      <Navigation />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 w-full max-w-[430px] lg:max-w-2xl mx-auto min-w-0 lg:py-6 lg:px-4">{children}</main>
      </div>
    </div>
  </>;
}
