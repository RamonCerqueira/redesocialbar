'use client';
export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="my-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100"><p>{message}</p><button type="button" onClick={retry} className="mt-3 min-h-11 rounded-full border border-amber-400/40 px-4 font-bold text-amber-300">Tentar novamente</button></div>;
}
