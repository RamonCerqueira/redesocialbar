import Link from 'next/link';
export default function NotFound() {
  return <section className="rounded-3xl border border-amber-500/20 p-8 text-center"><h1 className="text-xl font-bold">Página não encontrada</h1><p className="mt-3 text-sm text-stone-400">Esse endereço não está disponível.</p><Link href="/" className="mt-6 inline-block rounded-full bg-amber-400 px-5 py-3 font-bold text-black">Voltar ao início</Link></section>;
}
