'use client';
import { LoadError } from '@/components/load-error';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <LoadError message="Não foi possível abrir esta página. Tente novamente." retry={reset}/>;
}
