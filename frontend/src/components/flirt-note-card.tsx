'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FlirtNote } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { MatchModal } from './match-modal';
import { ReportModal } from './report-modal';
import { Sparkles, Eye, Heart, MoreHorizontal, Check, MapPin, Clock } from 'lucide-react';

interface FlirtNoteCardProps {
  note: FlirtNote;
  restaurantSlug?: string;
}

export function FlirtNoteCard({ note, restaurantSlug = 'pirambeira' }: FlirtNoteCardProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(note.likesCount);
  const [liked, setLiked] = useState(false);
  const [isSendingInterest, setIsSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [matchData, setMatchData] = useState<{
    isOpen: boolean;
    matchedUser: any;
    conversationId: string;
  }>({
    isOpen: false,
    matchedUser: null,
    conversationId: '',
  });

  const isMe = user?.id === note.author.id;

  const handleSendInterest = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSendingInterest(true);
    try {
      const res = await apiRequest<any>('/flirt/interest', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: note.author.id,
          restaurantSlug,
        }),
      });

      setInterestSent(true);

      if (res.isMatch) {
        setMatchData({
          isOpen: true,
          matchedUser: res.matchedUser,
          conversationId: res.conversationId,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao demonstrar interesse.');
    } finally {
      setIsSendingInterest(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await apiRequest(`/posts/${note.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ type: 'HEART' }),
      });
      setLiked(!liked);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } catch {}
  };

  return (
    <>
      <div className="kraft-note rounded-3xl p-5 border border-rose-500/25 hover:border-rose-500/45 transition-all relative overflow-hidden group">
        {/* Top Header: Mesa Context & Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 bg-rose-950/60 text-rose-300 border border-rose-700/30 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>{note.flirtContext || 'Mesa no Piramba'}</span>
          </div>

          <div className="flex items-center gap-1 text-[#A89F96]">
            <span className="text-[11px] font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#6E655D]" />
              {new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => setShowReport(true)}
              className="text-[#6E655D] hover:text-[#FBF8F5] p-1 rounded-lg"
              title="Reportar"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Body (Recado do Bar) */}
        <blockquote className="text-sm font-medium text-[#FBF8F5] leading-relaxed my-3.5 border-l-2 border-rose-500/50 pl-3.5 italic">
          "{note.content}"
        </blockquote>

        {/* Author snippet & Action Buttons */}
        <div className="pt-3 border-t border-[#2C221A] flex items-center justify-between">
          <Link
            href={`/perfil/${note.author.username}`}
            className="flex items-center gap-2.5 group/author"
          >
            <img
              src={
                note.author.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
              }
              alt={note.author.name}
              className="w-8 h-8 rounded-2xl object-cover border border-rose-500/40 group-hover/author:border-rose-400 transition-colors"
            />
            <div>
              <span className="text-xs font-bold text-[#FBF8F5] group-hover/author:text-rose-400 transition-colors block">
                {note.author.name}
              </span>
              <span className="text-[10px] text-amber-400/90 font-bold block">
                está aqui agora
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-2xl transition-all ${
                liked ? 'text-rose-400 bg-rose-500/20 glow-rose' : 'text-[#A89F96] hover:text-[#FBF8F5] bg-[#18130F]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span className="font-bold">{likes}</span>
            </button>

            {!isMe && (
              <button
                onClick={handleSendInterest}
                disabled={isSendingInterest || interestSent}
                className={`py-1.5 px-3.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  interestSent
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 glow-rose'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md glow-rose'
                }`}
              >
                {interestSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Olhar Enviado</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isSendingInterest ? '...' : 'Mandar um olhar'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {matchData.isOpen && (
        <MatchModal
          isOpen={matchData.isOpen}
          onClose={() => setMatchData({ isOpen: false, matchedUser: null, conversationId: '' })}
          matchedUser={matchData.matchedUser}
          conversationId={matchData.conversationId}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="POST"
        targetId={note.id}
      />
    </>
  );
}
