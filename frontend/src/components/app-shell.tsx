'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from './navigation';
import { Header } from './header';
import { SplashScreen } from './splash-screen';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && user?.mustChangePassword && pathname !== '/primeiro-acesso') router.replace('/primeiro-acesso');
  }, [isLoading, user?.mustChangePassword, pathname, router]);
  if (user?.mustChangePassword && pathname !== '/primeiro-acesso') return <p role="status" className="p-8 text-center">Preparando seu primeiro acesso…</p>;
  if (pathname.startsWith('/admin') || pathname === '/primeiro-acesso') return <>{children}</>;
  return <>
    <SplashScreen />
    <div className="flex min-h-screen">
      <Navigation />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 w-full max-w-[720px] mx-auto min-w-0 lg:py-2 lg:px-4">{children}</main>
      </div>
    </div>
  </>;
}
