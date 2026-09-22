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
  Heart,
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
    <div className="pb-24">
      {/* 1. Header do Perfil (padding: 25px 18px 18px, display: flex, items-center, gap: 14) */}
      <div className="pt-[25px] px-[18px] pb-[18px] flex items-center gap-[14px]">
        {/* Avatar: width 82, height 82, borderRadius 41, border 3px solid #FFB800 */}
        <div className="relative shrink-0">
          <img
            src={
              profile.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
            }
            alt={profile.name}
            className="w-[82px] h-[82px] rounded-[41px] object-cover border-[3px] border-[#FFB800] shadow-lg"
          />
          {profile.activeCheckIn && (
            <span
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00D084] border-2 border-[#080807] indicator-pulse-emerald flex items-center justify-center"
              title="No Pirambeira agora"
            />
          )}
        </div>

        {/* Identity: display flex, flexDirection column */}
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="font-display font-extrabold text-[21px] text-white leading-tight truncate">
            {profile.name}
          </h1>
          <span className="text-[12px] text-[#88837C] font-mono mt-0.5">
            @{profile.username}
          </span>
          {profile.activeCheckIn && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00D084] mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D084]" />
              <span>No Pirambeira agora</span>
            </div>
          )}
        </div>

        {/* Action icons right */}
        {isMe ? (
          <button
            onClick={logout}
            className="p-2 rounded-xl border border-[#302A20] bg-[#11100F] text-[#88837C] hover:text-red-400 cursor-pointer"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowReport(true)}
            className="p-2 rounded-xl border border-[#302A20] bg-[#11100F] text-[#88837C] hover:text-red-400 cursor-pointer"
            title="Reportar"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Stats: display grid, repeat(3, 1fr), padding 15px 18px, borderTop/Bottom 1px solid #28241F */}
      <div className="grid grid-cols-3 py-[15px] px-[18px] border-t border-b border-[#28241F] text-center">
        <div>
          <span className="font-display font-extrabold text-[16px] text-white block leading-none">
            {profile.counts?.posts || 0}
          </span>
          <span className="text-[10px] text-[#88837C] uppercase font-bold tracking-wider mt-1 block">
            Momentos
          </span>
        </div>
        <div className="border-l border-r border-[#28241F]">
          <span className="font-display font-extrabold text-[16px] text-white block leading-none">
            {profile.counts?.followers || 0}
          </span>
          <span className="text-[10px] text-[#88837C] uppercase font-bold tracking-wider mt-1 block">
            Seguidores
          </span>
        </div>
        <div>
          <span className="font-display font-extrabold text-[16px] text-[#FFB800] block leading-none">
            {profile.checkInCount || 0}
          </span>
          <span className="text-[10px] text-[#88837C] uppercase font-bold tracking-wider mt-1 block">
            Visitas
          </span>
        </div>
      </div>

      {/* 3. Action / Edit Button: margin 14px 18px, height 40, borderRadius 20, border 1px solid #FFB800 */}
      <div className="mx-[18px] my-[14px]">
        {isMe ? (
          <button
            onClick={() => setShowSettings(true)}
            className="w-full h-[40px] rounded-[20px] border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Editar Perfil & Privacidade</span>
          </button>
        ) : (
          <button
            onClick={handleToggleFollow}
            className={`w-full h-[40px] rounded-[20px] font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isFollowing
                ? 'border border-[#302A20] bg-[#11100F] text-white'
                : 'bg-[#FFB800] text-[#080807] shadow-[0_0_15px_rgba(255,184,0,0.3)]'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-4 h-4 text-[#00D084]" />
                <span>Seguindo</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Seguir Frequentador</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Settings Grid: display grid, 1fr 1fr, gap 10, padding 0 18px, item height 74 */}
      {isMe && (
        <div className="grid grid-cols-2 gap-2.5 px-[18px] mb-5">
          <button
            onClick={() => setShowSettings(true)}
            className="h-[74px] rounded-[18px] bg-[#14110E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#FF2D70]/40 shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex items-center gap-2.5 p-3 text-left transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF2D70]/15 border border-[#FF2D70]/30 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-[#FF2D70]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">Radar da Paquera</span>
              <span className="text-[10px] text-[#88837C] block truncate mt-0.5">
                {showInFlirtRadar ? 'Visível' : 'Oculto'}
              </span>
            </div>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="h-[74px] rounded-[18px] bg-[#14110E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#00D084]/40 shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex items-center gap-2.5 p-3 text-left transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#00D084]/15 border border-[#00D084]/30 flex items-center justify-center shrink-0">
              <Beer className="w-4 h-4 text-[#00D084]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">Modo Fantasma</span>
              <span className="text-[10px] text-[#88837C] block truncate mt-0.5">
                {invisibleMode ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </button>
        </div>
      )}

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
