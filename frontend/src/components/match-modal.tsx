'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Sparkles, MessageSquare, X, Heart } from 'lucide-react';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: {
    name: string;
    avatarUrl?: string;
    username: string;
  };
  conversationId: string;
}

export function MatchModal({
  isOpen,
  onClose,
  matchedUser,
  conversationId,
}: MatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EA580C', '#F43F5E', '#FBF8F5'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm surface-floating rounded-3xl p-6 border border-amber-500/40 text-center glow-amber-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#A89F96] hover:text-[#FBF8F5] hover:bg-[#1E1814]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl amber-gradient mx-auto flex items-center justify-center text-[#080706] shadow-lg glow-amber-sm mb-4 animate-bounce">
          <Sparkles className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="relative inline-block mb-4">
          <img
            src={
              matchedUser.avatarUrl ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
            }
            alt={matchedUser.name}
            className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-500/80 mx-auto shadow-2xl"
          />
          <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white p-2 rounded-2xl shadow-md glow-rose">
            <Heart className="w-4 h-4 fill-white" />
          </div>
        </div>

        <h3 className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-300 to-amber-300">
          ✨ Deu Match no Piramba!
        </h3>
        
        <p className="font-display font-bold text-sm text-[#FBF8F5] mt-2">
          Você e {matchedUser.name} demonstraram interesse!
        </p>

        <p className="text-xs text-[#A89F96] mt-1 mb-6 px-2 leading-relaxed">
          Vocês estão no mesmo bar e a conversa privada foi liberada de forma 100% discreta.
        </p>

        <div className="space-y-2">
          <Link
            href={`/chat/${conversationId}`}
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-amber-sm active:scale-95 transition-transform"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Conversar Agora</span>
          </Link>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#18130F] hover:bg-[#241B15] text-[#A89F96] hover:text-[#FBF8F5] text-xs font-bold transition-colors cursor-pointer"
          >
            Continuar no Bar
          </button>
        </div>
      </div>
    </div>
  );
}
