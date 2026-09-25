'use client';

import React, { useState, useEffect } from 'react';
import { FlirtNote } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { FlirtNoteCard } from '@/components/flirt-note-card';
import { RecadinhoModal } from '@/components/recadinho-modal';
import {
  PenLine,
  PlusCircle,
  Sparkles,
  MapPin,
  Heart,
  MessageSquare,
} from 'lucide-react';

export default function RecadosGuardanapoPage() {
  const [notes, setNotes] = useState<FlirtNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecadinhoModal, setShowRecadinhoModal] = useState(false);

  const loadNotes = async () => {
    try {
      const data = await apiRequest<FlirtNote[]>('/flirt/notes/pirambeira');
      if (data && data.length > 0) {
        setNotes(data);
      } else {
        setNotes([]);
      }
    } catch (err) {
      // Mantém o mural vazio quando a consulta falha.
      setNotes([]);
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
    <div className="max-w-xl mx-auto pb-24 px-[18px]">
      {/* Header Principal da Página */}
      <div className="pt-5 pb-4 flex items-center justify-between gap-3 border-b border-[#2C221A] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            <h1 className="font-display font-medium text-[24px] sm:text-[26px] text-white tracking-tight leading-tight">
              Paquera do Piramba
            </h1>
          </div>
          <p className="text-xs text-[#A9A5A0] mt-1 font-medium leading-relaxed">
            Como aqueles bilhetinhos que o garçom entrega na mesa do Pírambeira 🍻
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRecadinhoModal(true)}
          className="h-[40px] px-4 rounded-[20px] bg-[#FFB800] hover:bg-[#FFC928] text-[#080807] font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_18px_rgba(255,184,0,0.3)] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <PenLine className="w-4 h-4 stroke-[2.5]" />
          <span>Deixar recado</span>
        </button>
      </div>

      {/* Banner Informativo Rápido */}
      <div className="mb-4 p-3.5 rounded-[18px] bg-[#14100D]/75 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00D084] indicator-pulse-emerald shrink-0" />
          <span className="text-xs text-[#C5BCB2]">
            <strong className="text-white">{notes.length} recados</strong> postados no bar hoje
          </span>
        </div>
        <span className="text-[10px] text-[#FF9E40] font-semibold flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#FF7900]" />
          <span>Mesa e @ são opcionais</span>
        </span>
      </div>

      {/* Lista de Recados Postados no Guardanapo */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[22px] p-5 h-36 animate-pulse bg-[#14100D]/60 backdrop-blur-md border border-white/[0.05]"
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-[24px] p-8 text-center bg-[#120F0D]/75 backdrop-blur-2xl border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4 my-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FFB800]/15 text-[#FFB800] flex items-center justify-center mx-auto text-2xl">
            ✍️
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-white text-base">
              Nenhum recadinho no guardanapo ainda
            </h3>
            <p className="text-xs text-[#A89F96] max-w-sm mx-auto leading-relaxed">
              Viu alguém legal na mesa ao lado ou no balcão? Escreva o primeiro bilhetinho no guardanapo!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRecadinhoModal(true)}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-[#FFB800] hover:bg-[#FFC928] text-[#080807] font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Escrever primeiro guardanapo</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notes.map((note) => (
            <FlirtNoteCard key={note.id} note={note} restaurantSlug="pirambeira" />
          ))}
        </div>
      )}

      {/* Modal para Escrever Recado no Guardanapo */}
      <RecadinhoModal
        isOpen={showRecadinhoModal}
        onClose={() => setShowRecadinhoModal(false)}
        onSuccess={handleNoteCreated}
        restaurantSlug="pirambeira"
      />
    </div>
  );
}
