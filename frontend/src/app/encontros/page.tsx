'use client';

import React, { useState, useEffect } from 'react';
import { Meetup } from '@/lib/types';
import { LoadError } from '@/components/load-error';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MeetupCard } from '@/components/meetup-card';
import { Beer, PlusCircle, X, Users, Calendar, Sparkles } from 'lucide-react';

export default function EncontrosPage() {
  const { user } = useAuth();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMeetups = async () => {
    setIsLoading(true); setLoadError('');
    try {
      const data = await apiRequest<Meetup[]>('/meetups/restaurant/pirambeira');
      setMeetups(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os encontros.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetups();
  }, []);

  const handleCreateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !scheduledFor) return;

    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/meetups', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          scheduledFor: new Date(scheduledFor).toISOString(),
          restaurantSlug: 'pirambeira',
        }),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setScheduledFor('');
      loadMeetups();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar encontro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Header */}
      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/20 relative overflow-hidden glow-amber-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest mb-1.5">
              <Beer className="w-4 h-4" />
              <span>RODA DE CHOPP & AMIZADES</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
              Mesas Comunitárias
            </h1>
            <p className="text-xs text-[#A89F96] mt-1.5 max-w-lg leading-relaxed font-medium">
              Combine uma mesa aberta no Pirambeira, puxe uma cadeira com outros frequentadores ou venha tomar uma depois do trampo.
            </p>
          </div>

          <button
            onClick={() => (user ? setShowCreateModal(true) : (window.location.href = '/login'))}
            className="py-3 px-5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg glow-amber-sm active:scale-95 transition-transform shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Abrir Nova Mesa</span>
          </button>
        </div>
      </div>

      {/* 2. Meetups List */}
      {loadError ? <LoadError message={loadError} retry={() => void loadMeetups()}/> : isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="surface-ambient rounded-3xl p-5 h-44 animate-pulse border border-amber-500/10" />
          ))}
        </div>
      ) : meetups.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-10 text-center border border-amber-500/15">
          <Beer className="w-12 h-12 text-[#6E655D] mx-auto mb-3" />
          <h3 className="font-display font-bold text-sm text-[#FBF8F5]">
            Nenhuma mesa aberta para hoje ainda
          </h3>
          <p className="text-xs text-[#A89F96] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Seja você a abrir a primeira rodada e convide quem estiver no bar para se juntar!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetups.map((m) => (
            <MeetupCard key={m.id} meetup={m} onMeetupUpdate={loadMeetups} />
          ))}
        </div>
      )}

      {/* 3. Create Meetup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md surface-floating rounded-3xl p-6 border border-amber-500/25 space-y-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A89F96] hover:text-[#FBF8F5]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Beer className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-black text-lg text-[#FBF8F5]">
                Abrir Mesa no Bar
              </h3>
            </div>
            <p className="text-xs text-[#A89F96] leading-relaxed">
              Crie uma mesa aberta no Restaurante Pirambeira para outros frequentadores puxarem uma cadeira.
            </p>

            <form onSubmit={handleCreateMeetup} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
                  Título da Mesa
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: 🍻 Chopp com a galera do trampo"
                  className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl px-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
                  Horário
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl px-4 py-2.5 text-xs text-[#FBF8F5] focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
                  Onde vamos sentar & Descrição
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Mesa externa perto do palco a partir das 19h30. Só colar e pedir um chopp!"
                  className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl p-3 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 resize-none leading-relaxed font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider shadow-lg glow-amber-sm active:scale-95 transition-transform cursor-pointer mt-2"
              >
                {isSubmitting ? 'Abrindo Mesa...' : 'Publicar Mesa no Salão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
