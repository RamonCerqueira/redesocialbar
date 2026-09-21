'use client';

import React, { useState, useEffect } from 'react';
import { FlirtNote } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { FlirtNoteCard } from '@/components/flirt-note-card';
import { InfoModal } from '@/components/info-modal';
import { RecadinhoModal } from '@/components/recadinho-modal';
import {
  Heart,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Info,
  Flame,
} from 'lucide-react';

export default function MuralDaPaqueraPage() {
  const [notes, setNotes] = useState<FlirtNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRecadinhoModal, setShowRecadinhoModal] = useState(false);

  const loadNotes = async () => {
    try {
      const data = await apiRequest<FlirtNote[]>('/flirt/notes/pirambeira');
      setNotes(data);
    } catch (err) {
      console.error('Erro ao carregar notas do mural:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();

    const handleOpenRecadinho = () => setShowRecadinhoModal(true);
    window.addEventListener('open-recadinho-modal', handleOpenRecadinho);
    return () => window.removeEventListener('open-recadinho-modal', handleOpenRecadinho);
  }, []);

  const handleNoteCreated = (newNote: FlirtNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12">
      {/* 1. Header Compacto e Limpo (Sem card gigante fixo) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-2xl text-white tracking-tight">
              Mural da Paquera
            </h1>
            {/* Info Trigger Button (Abre o Popup que antes ficava fixo) */}
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="p-1 rounded-full text-[#8E867E] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Como funciona o Mural da Paquera"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#A89F96] mt-0.5">
            Recados de quem está no Piramba agora
          </p>
        </div>

        {/* Botão Novo Recadinho */}
        <button
          type="button"
          onClick={() => setShowRecadinhoModal(true)}
          className="py-2 px-3.5 sm:px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-display font-extrabold text-xs flex items-center gap-1.5 shadow-lg glow-rose active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Deixar Recadinho</span>
        </button>
      </div>

      {/* 2. Barra de Status com Chip Informativo Clicável */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Recados no bar
          </span>
          <span className="text-xs text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30 font-bold">
            {notes.length}
          </span>
        </div>

        {/* Small Discreet Helper Pill that opens the Info Popup */}
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-1.5 text-[11px] text-[#A89F96] hover:text-rose-300 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Double Opt-in Silencioso</span>
        </button>
      </div>

      {/* 3. Lista de Bilhetes do Mural */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="surface-ambient rounded-3xl p-5 h-32 animate-pulse border border-rose-500/15"
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-8 sm:p-10 text-center border border-rose-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 fill-rose-500/30" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-white text-base">
              Nenhum recado no mural ainda
            </h3>
            <p className="text-xs text-[#A89F96] max-w-sm mx-auto leading-relaxed">
              Viu alguém interessante no bar hoje? Deixe o primeiro recadinho de forma leve, divertida e discreta!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRecadinhoModal(true)}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-lg glow-rose active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Mandar primeiro recado</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notes.map((note) => (
            <FlirtNoteCard key={note.id} note={note} restaurantSlug="pirambeira" />
          ))}
        </div>
      )}

      {/* POPUP 1: Informações & Regras de Privacidade (O que antes era o card fixo gigante) */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        badge={{
          icon: Heart,
          label: 'ESPAÇO DE CONEXÃO DISCRETA',
          variant: 'rose',
        }}
        title="Mural da Paquera"
        subtitle="Conexão leve e autêntica dentro do bar"
        description="Deixe um recado discreto para quem chamou sua atenção no bar ou mande um olhar para alguém que está aqui agora. Se a pessoa também demonstrar interesse recíproco: Deu Match no Piramba!"
        highlights={[
          {
            icon: ShieldCheck,
            title: 'Double Opt-in Silencioso',
            text: 'Nenhum contato invasivo. A conversa só é liberada se ambos demonstrarem interesse mútuo.',
          },
          {
            icon: Sparkles,
            title: 'Exclusivo do Bar',
            text: 'Feito para quem está vivendo a noite presencialmente no Restaurante Pirambeira.',
          },
        ]}
        confirmLabel="Entendi, voltar ao mural"
      />

      {/* POPUP 2: Criar Novo Recadinho (Sem foto, apenas texto e mesa) */}
      <RecadinhoModal
        isOpen={showRecadinhoModal}
        onClose={() => setShowRecadinhoModal(false)}
        onSuccess={handleNoteCreated}
        restaurantSlug="pirambeira"
      />
    </div>
  );
}
