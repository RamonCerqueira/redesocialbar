'use client';

import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

export function SponsoredCard() {
  return (
    <div className="surface-elevated rounded-3xl p-4 border border-amber-500/20 mb-5 relative overflow-hidden glow-amber-sm">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] bg-amber-500/15 text-amber-400 font-display font-black px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          SUGESTÃO DA CASA
        </span>
        <span className="text-[10px] text-[#A89F96] font-bold">Parceiro da Pituba</span>
      </div>

      <div className="flex gap-3.5 items-center">
        <img
          src="https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=200&q=80"
          alt="Cachaça Rio de Engenho"
          className="w-16 h-16 rounded-2xl object-cover border border-amber-500/30 shrink-0 shadow-md"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-[#FBF8F5] text-xs truncate">
            Cachaça Artesanal Rio de Engenho
          </h4>
          <p className="text-[11px] text-[#A89F96] mt-0.5 leading-snug line-clamp-2 font-medium">
            Direto do sul da Bahia para o seu drink autoral no Pirambeira. Peça ao garçom no balcão!
          </p>
          <a
            href="https://instagram.com/pirambeira.bar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold mt-1 transition-colors"
          >
            <span>Conhecer mais</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
