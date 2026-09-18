'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ReportModal } from '@/components/report-modal';
import {
  MapPin,
  Flame,
  UserCheck,
  UserPlus,
  ShieldAlert,
  LogOut,
  Settings,
  X,
  Lock,
  Eye,
  Check,
  Beer,
  Sparkles,
  Camera,
} from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = React.use(params);
  const { user: currentUser, logout, refreshUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Settings states
  const [showInFlirtRadar, setShowInFlirtRadar] = useState(true);
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await apiRequest<any>(`/users/profile/${username}`);
      setProfile(data);
      setIsFollowing(data.isFollowing);
      setShowInFlirtRadar(data.showInFlirtRadar ?? true);
      setInvisibleMode(data.invisibleMode ?? false);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const isMe = currentUser?.profile?.username === username;

  const handleToggleFollow = async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await apiRequest<{ following: boolean }>(`/users/${profile.id}/follow`, {
        method: 'POST',
      });
      setIsFollowing(res.following);
      setProfile((prev: any) => ({
        ...prev,
        counts: {
          ...prev.counts,
          followers: res.following ? prev.counts.followers + 1 : prev.counts.followers - 1,
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Erro ao seguir usuário.');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          showInFlirtRadar,
          invisibleMode,
        }),
      });
      setSavedSettings(true);
      refreshUser();
      setTimeout(() => {
        setSavedSettings(false);
        setShowSettings(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="surface-elevated rounded-3xl p-10 text-center border border-[#2C221A]">
        <h3 className="font-display font-bold text-[#FBF8F5] text-base">Perfil não encontrado</h3>
        <p className="text-xs text-[#A89F96] mt-1">Este frequentador não existe ou mudou de @.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="surface-elevated rounded-3xl overflow-hidden border border-amber-500/20 glow-amber-sm">
        {/* Cover Photo */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-amber-700/40 via-[#1C1714] to-[#080706] relative">
          <div className="absolute inset-0 bg-[#080706]/30" />
        </div>

        {/* Avatar, Details & Actions */}
        <div className="p-5 sm:p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 mb-4 gap-4">
            <div className="relative inline-block">
              <img
                src={
                  profile.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                }
                alt={profile.name}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-[#080706] shadow-2xl"
              />
              {profile.activeCheckIn && (
                <span
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#080706] indicator-pulse-emerald flex items-center justify-center"
                  title="No Pirambeira agora"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {isMe ? (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="py-2 px-3.5 rounded-2xl bg-[#18130F] hover:bg-[#241B15] text-[#FBF8F5] text-xs font-bold border border-[#2C221A] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Privacidade</span>
                  </button>
                  <button
                    onClick={logout}
                    className="p-2 rounded-2xl bg-[#18130F] hover:bg-[#241B15] text-[#A89F96] hover:text-red-400 border border-[#2C221A] transition-colors cursor-pointer"
                    title="Sair da Conta"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleToggleFollow}
                    className={`py-2 px-4 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isFollowing
                        ? 'bg-[#18130F] text-[#FBF8F5] border border-[#2C221A]'
                        : 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Seguindo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowReport(true)}
                    className="p-2 text-[#6E655D] hover:text-red-400 rounded-2xl bg-[#18130F] border border-[#2C221A] cursor-pointer"
                    title="Reportar Usuário"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name, Status & Bio */}
          <div className="space-y-1.5">
            <h1 className="font-display font-black text-xl text-[#FBF8F5]">{profile.name}</h1>
            <p className="text-xs text-amber-400 font-mono font-semibold">@{profile.username}</p>

            {profile.activeCheckIn && (
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold mt-1 glow-emerald">
                <span className="w-2 h-2 rounded-full bg-emerald-400 indicator-pulse-emerald" />
                <span>Presente no {profile.activeCheckIn.restaurantName} agora</span>
              </div>
            )}

            <p className="text-xs text-[#A89F96] leading-relaxed pt-1.5 max-w-lg font-medium">
              {profile.bio || 'Frequentador assíduo do Tô no Piramba.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A89F96] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{profile.city || 'Salvador, BA'}</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>{profile.checkInCount} visitas ao Pirambeira</span>
              </span>
            </div>

            {/* Interest Tags */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {profile.interests.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-[#18130F] text-amber-300/90 font-medium px-2.5 py-0.5 rounded-lg border border-amber-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#2C221A] text-center">
            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="block font-display font-black text-base text-[#FBF8F5]">
                {profile.counts?.posts || 0}
              </span>
              <span className="text-[10px] text-[#A89F96] uppercase font-bold tracking-wider">
                Momentos
              </span>
            </div>
            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="block font-display font-black text-base text-[#FBF8F5]">
                {profile.counts?.followers || 0}
              </span>
              <span className="text-[10px] text-[#A89F96] uppercase font-bold tracking-wider">
                Seguidores
              </span>
            </div>
            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="block font-display font-black text-base text-[#FBF8F5]">
                {profile.counts?.following || 0}
              </span>
              <span className="text-[10px] text-[#A89F96] uppercase font-bold tracking-wider">
                Seguindo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts Grid */}
      <section className="space-y-3">
        <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#FBF8F5] flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          <span>FOTOS & MOMENTOS NO BAR</span>
        </h3>

        {profile.recentPosts && profile.recentPosts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.recentPosts.map((p: any) => (
              <div
                key={p.id}
                className="surface-elevated rounded-2xl overflow-hidden border border-[#2C221A] aspect-square group relative"
              >
                {p.media && p.media.length > 0 ? (
                  <img
                    src={p.media[0]}
                    alt="Post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-3 bg-[#18130F] flex items-center justify-center text-center text-xs text-[#A89F96] italic">
                    "{p.content.substring(0, 70)}..."
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="surface-ambient rounded-2xl p-6 text-center border border-[#2C221A]">
            <p className="text-xs text-[#A89F96]">Nenhum momento registrado no bar ainda.</p>
          </div>
        )}
      </section>

      {/* Privacy Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md surface-floating rounded-3xl p-6 border border-amber-500/25 space-y-4">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A89F96] hover:text-[#FBF8F5]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-black text-base text-[#FBF8F5]">
                Privacidade & Radar da Paquera
              </h3>
            </div>
            <p className="text-xs text-[#A89F96] leading-relaxed">
              Controle sua visibilidade no bar e como você se conecta com outros frequentadores.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 bg-[#18130F] rounded-2xl border border-[#2C221A] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#FBF8F5] block">
                    Aparecer no Radar da Paquera
                  </span>
                  <span className="text-[11px] text-[#A89F96]">
                    Permite que outros clientes mandem um olhar discreto
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showInFlirtRadar}
                  onChange={(e) => setShowInFlirtRadar(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-[#18130F] rounded-2xl border border-[#2C221A] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#FBF8F5] block">
                    Modo Invisível
                  </span>
                  <span className="text-[11px] text-[#A89F96]">
                    Oculta você da lista pública de "Quem está aqui agora"
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={invisibleMode}
                  onChange={(e) => setInvisibleMode(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>

              <button
                onClick={handleSavePrivacy}
                className="w-full py-3 px-4 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs shadow-md glow-amber-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {savedSettings ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Configurações Salvas!</span>
                  </>
                ) : (
                  <span>Salvar Preferências</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="USER"
        targetId={profile.id}
      />
    </div>
  );
}
