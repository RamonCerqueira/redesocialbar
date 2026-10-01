'use client';
import { useState } from 'react';
import { Copy, ArrowUpRight } from 'lucide-react';

export const BAR_ADDRESS = 'Rua Guillard Muniz, 629 - Pituba, Salvador - BA, 41810-110';
const uberQuery = new URLSearchParams({ action: 'setPickup', pickup: 'my_location', 'dropoff[nickname]': 'Pirambeira', 'dropoff[formatted_address]': BAR_ADDRESS });
export function RideLinks() {
  const [message, setMessage] = useState('');
  async function copy() { try { await navigator.clipboard.writeText(BAR_ADDRESS); setMessage('Endereço copiado. Cole no aplicativo de transporte.'); } catch { setMessage('Selecione e copie o endereço abaixo.'); } }
  return <section aria-label="Transporte para o Pirambeira" className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-4">
    <h3 className="text-sm font-semibold text-white">Bora pro Piramba?</h3><p className="mt-1 text-xs text-stone-400">Escolha como chegar. Você confirma a corrida no app de transporte.</p>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <a href={'https://m.uber.com/ul/?'+uberQuery} target="_blank" rel="noopener noreferrer" aria-label="Abrir Uber para ir ao Pirambeira" className="flex min-h-16 items-center justify-between gap-2 rounded-xl border border-white/15 bg-black px-3 py-3"><img src="/brands/uber.svg" alt="" className="h-8 w-20 object-contain invert" /><ArrowUpRight size={16} /></a>
      <a href="https://99.onelink.me/Mayr" target="_blank" rel="noopener noreferrer" aria-label="Abrir 99" className="flex min-h-16 items-center justify-between gap-2 rounded-xl bg-[#FFDD00] px-3 py-3 text-black"><svg aria-hidden="true" viewBox="0 0 68 42" className="h-9 w-16"><text x="4" y="35" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="44" fontWeight="900" letterSpacing="-5" fill="currentColor">99</text></svg><ArrowUpRight size={16} /></a>
    </div><p className="mt-3 select-text text-xs leading-relaxed text-stone-300">{BAR_ADDRESS}</p><button type="button" onClick={copy} className="mt-3 flex min-h-10 items-center gap-2 text-xs font-semibold text-amber-300"><Copy size={15} />Copiar endereço para a corrida</button><p className="text-xs text-amber-200" role="status">{message}</p><p className="mt-2 text-[11px] text-stone-400">Uber: confira o destino ao abrir. 99: abra o serviço e cole o endereço.</p>
  </section>;
}
