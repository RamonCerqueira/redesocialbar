'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Share2,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteText =
    '🍻 Tô no Piramba agora! O chopp tá gelado, gente bonita e aquele clima baiano que só o Piramba tem. Bora colar aqui comigo?\n📍 Restaurante Pirambeira - Pituba\n🔗 https://tonopiramba.com.br';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Tô no Piramba!',
          text: 'Bora colar no Piramba hoje?',
          url: 'https://tonopiramba.com.br',
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#120F0D] border border-amber-500/35 p-6 sm:p-7 shadow-2xl space-y-4 overflow-hidden glow-amber-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2C221A]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 flex items-center justify-center text-[#F5A623]">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white tracking-tight">
                Convidar Pirambeiro
              </h2>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Chame a galera pro bar
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1C1714] text-[#A89F96] hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Invite Card Box */}
        <div className="p-4 rounded-2xl bg-[#18130F] border border-[#2C221A] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Mensagem do Convite</span>
          </div>

          <p className="text-xs text-[#E5DDD5] leading-relaxed italic bg-[#0E0C0A] p-3 rounded-xl border border-white/5 font-sans">
            "{inviteText}"
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-[#080706] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current stroke-none" />
            <span>Enviar pelo WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-2xl bg-[#1C1714] hover:bg-[#251F1B] border border-amber-500/30 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">Convite Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#F5A623]" />
                <span>Copiar texto do convite</span>
              </>
            )}
          </button>

          {/* Native Share (se disponível) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-white/5 text-[#8E867E] hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Outras opções de compartilhamento</span>
          </button>
        </div>
      </div>
    </div>
  );
}
