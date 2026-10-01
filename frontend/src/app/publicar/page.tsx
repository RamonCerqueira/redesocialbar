'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Patron } from '@/lib/types';
import { submitPost } from '@/lib/publish/publish.actions';
import { PostModel } from '@/lib/publish/post.schema';
import screenConfig from '@/lib/publish/publish-screen.json';
import { CameraCapture } from '@/components/camera-capture';
import { PhotoEditor } from '@/components/photo-editor';
import { photoFromFile } from '@/lib/camera-photo';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Users,
  Send,
  Beer,
  MapPin,
  X,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Home,
  Search,
  Video,
  Sparkles,
  Lock,
  Info,
} from 'lucide-react';

export default function PublicarPage() {
  const router = useRouter();
  const { user, isLoading, activeCheckIn } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);
  const config = screenConfig.screen;

  const [patrons, setPatrons] = useState<Patron[]>([]);
  useEffect(() => {
    // Busca apenas quem o usuário segue e está no bar agora
    apiRequest<{patrons: Patron[]}>('/check-ins/who-is-here/pirambeira?filter=friends')
      .then(data => setPatrons(data.patrons))
      .catch(() => setPatrons([]));
  }, []);

  // Media state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [showMediaTypeDropdown, setShowMediaTypeDropdown] = useState(false);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<string | null>(null);

  // Form states
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['friends']);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // Visibility state (Sempre Feed do Bar)
  const [visibility] = useState({
    barFeed: true,
    flirtWall: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    setPhotoLoading(true);
    try {
      setPendingPhoto(await photoFromFile(file));
      setMediaType('photo');
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : 'Não foi possível abrir a foto.');
    } finally { setPhotoLoading(false); }
  };

  const toggleQuickTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleTagUser = (username: string) => {
    setTaggedUsers((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const handlePublish = async () => {
    if (isSubmitting || photoLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const postPayload: PostModel = {
        authorId: user.id || 'current-user',
        venueId: 'pirambeira',
        type: mediaType,
        media: selectedPhoto ? [{ type: 'image', url: selectedPhoto }] : [],
        caption: caption.trim(),
        tags: selectedTags,
        taggedUsers,
        location: {
          venueId: 'pirambeira',
          name: 'Pirambeira',
        },
        visibility,
      };

      await submitPost(postPayload);
      router.push('/feed');
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatrons = patrons.filter((p) => {
    const q = friendSearch.toLowerCase().replace('@', '');
    return p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q);
  });

  if (isLoading || !user) return <p className="py-8 text-center text-sm text-neutral-400">Verificando acesso...</p>;

  return (
    <div className="max-w-md mx-auto pb-12 space-y-4 text-[#FBF8F5]">
      {/* Hidden file and camera inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.heic,.heif,.avif,.tif,.tiff,.bmp,.jpg,.jpeg,.jfif,.png,.webp,.gif"
        onChange={event => { void handleFileChange(event); }}
        className="hidden"
      />
      {isCameraActive && <CameraCapture title="Foto do seu momento" onClose={() => setIsCameraActive(false)} onCapture={photo => { setSelectedPhoto(photo); setPhotoSource(photo); setMediaType('photo'); setPhotoError(''); setIsCameraActive(false); }} />}
      {pendingPhoto && <PhotoEditor source={pendingPhoto} aspectRatio={4 / 5} allowOriginal onCancel={() => setPendingPhoto(null)} onConfirm={photo => { setSelectedPhoto(photo); setPhotoSource(pendingPhoto); setMediaType('photo'); setPendingPhoto(null); }} />}
        {photoLoading && <p role="status" className="px-5 text-sm text-amber-300">Preparando sua foto…</p>}
        {photoError && <p role="alert" className="px-5 text-sm text-rose-300">{photoError}</p>}

      {/* 1. HEADER (height: 60px, padding: 0 18px, display: flex, items-center, justify-between) */}
      <div className="h-[60px] px-[18px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-[#A89F96] hover:text-white transition-colors active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="font-display font-black text-xl text-white tracking-tight leading-none">
              Publicar
            </h1>
            <p className="text-[10px] text-[#A9A5A0] mt-0.5">
              Compartilhe seu momento no Piramba
            </p>
          </div>
        </div>

        {/* Check-in Active Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11100F] border border-[#3A2908] text-left shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#00D084] indicator-pulse-emerald" />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-white block">
              Pirambeira
            </span>
            <span className="text-[9px] text-[#FFB800] font-extrabold block">
              {activeCheckIn ? 'Check-in ativo' : 'Sem check-in ativo'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MEDIA AREA — proporção 4:5 */}
      <div className="mx-[18px] rounded-[20px] bg-[#0d0b09] border border-[#2a2118] overflow-hidden relative"
           style={{ aspectRatio: '4/5' }}>
        {/* Case B: Foto selecionada */}
        {selectedPhoto && (
          <>
            <button type="button" onClick={() => setPendingPhoto(photoSource || selectedPhoto)} className="absolute top-3 left-3 z-10 rounded-full bg-black/70 px-3 py-2 text-xs text-amber-300">Ajustar foto</button>
            <img src={selectedPhoto} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
            <button type="button" onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/65 backdrop-blur-md text-white flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Case C: Estado vazio */}
        {!selectedPhoto && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#3a3228]">
            <Camera className="w-10 h-10 stroke-[1.2]" />
            <span className="text-[11px] font-semibold tracking-wide">Adicione uma foto</span>
          </div>
        )}

        {/* Floating action pills — câmera + galeria (sempre visíveis, exceto quando câmera ativa) */}
        {!isCameraActive && (
          <div className="absolute bottom-3.5 inset-x-0 flex items-center justify-center gap-2.5 z-10">
            <button type="button" onClick={() => setIsCameraActive(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold active:scale-95 transition-all">
              <Camera className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Câmera</span>
            </button>
            <button type="button" disabled={photoLoading} onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold active:scale-95 transition-all">
              <ImageIcon className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Galeria</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. AUTHOR ROW & MARCAR AMIGOS */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <img
            src={
              user?.profile?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
            alt="Usuário"
            className="w-9 h-9 rounded-2xl object-cover border border-amber-500/40"
          />
          <span className="text-xs font-bold text-[#FBF8F5]">
            {user?.profile?.username ? `@${user.profile.username}` : '@voce.piramba'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowFriendSelector(true)}
          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>
            {taggedUsers.length > 0
              ? `${taggedUsers.length} amigo(s) marcado(s)`
              : 'Marcar amigos'}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. CAPTION (margin: 0 18px, minHeight: 100, borderRadius: 16, background: #11100F, border: 1px solid #302A20, padding: 14) */}
      <div className="mx-[18px] min-h-[100px] rounded-[16px] bg-[#11100F] border border-[#302A20] p-[14px] space-y-2 focus-within:border-[#FFB800]/40 transition-colors">
        <textarea
          rows={3}
          maxLength={280}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="O que está rolando? Conta pra galera o que está acontecendo no Pirambeira..."
          className="w-full bg-transparent border-none text-xs text-white placeholder-[#716D68] focus:outline-none resize-none leading-relaxed font-medium"
        />
        <div className="text-right">
          <span className="text-[10px] text-[#716D68] font-mono">
            {caption.length}/280
          </span>
        </div>
      </div>

      {/* 5. QUICK TAGS */}
      <div className="mx-[18px] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {config.quickTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleQuickTag(tag.id)}
              className={`py-2 px-3.5 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/40 shadow-[0_0_12px_rgba(255,184,0,0.15)]'
                  : 'bg-transparent text-[#7A7267] border border-[#2a2118] hover:border-[#FFB800]/25 hover:text-[#A89F96]'
              }`}
            >
              <span className="text-[13px] leading-none">{tag.emoji}</span>
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6. PUBLISH BUTTON */}
      <div className="mx-[18px] pt-2 pb-6">
        <div className="h-px bg-white/[0.05] mb-5" />
        <button
          type="button"
          onClick={handlePublish}
          disabled={isSubmitting || photoLoading || (!selectedPhoto && !caption.trim())}
          className="w-full h-[52px] rounded-2xl text-[#080807] font-black text-[13px] tracking-widest uppercase flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(110deg, #FFC928 0%, #FF8200 100%)',
            boxShadow: '0 4px 28px rgba(255,160,0,0.3), 0 1px 0 rgba(255,255,255,0.15) inset',
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
              </svg>
              <span>Publicando...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Publicar no Feed</span>
            </>
          )}
        </button>
      </div>

      {/* 7. BOTTOM SHEET — Marcar Amigos */}
      {showFriendSelector && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            style={{ animation: 'overlayFadeIn .2s ease both' }}
            onClick={() => setShowFriendSelector(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[60] max-w-md mx-auto rounded-t-[28px] bg-[#0e0c0a] border-t border-white/[0.07] flex flex-col"
            style={{ animation: 'sheetSlideUp .28s cubic-bezier(0.16,1,0.3,1) both', maxHeight: '78vh' }}
          >
            <style>{`
              @keyframes overlayFadeIn { from{opacity:0} to{opacity:1} }
              @keyframes sheetSlideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
            `}</style>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
              <div>
                <h3 className="font-black text-[15px] text-white tracking-tight">Marcar na foto</h3>
                <p className="text-[11px] text-[#5a5349] mt-0.5">
                  {patrons.length === 0
                    ? 'Nenhum amigo no bar agora'
                    : `${patrons.length} amigo${patrons.length === 1 ? '' : 's'} no bar agora`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFriendSelector(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#A89F96] hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#4a4540] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Buscar amigo..."
                  className="w-full bg-[#161210] border border-[#252018] rounded-2xl pl-9 pr-4 py-2.5 text-[12px] text-[#EDE9E4] placeholder-[#4a4540] focus:outline-none focus:border-[#FFB800]/30 transition-colors"
                />
              </div>
            </div>

            <div className="h-px bg-white/[0.05] mx-5 shrink-0" />

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-none">
              {patrons.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <Users className="w-8 h-8 text-[#2e2a25] stroke-[1.5]" />
                  <p className="text-[12px] text-[#4a4540]">Nenhum amigo com check-in ativo</p>
                  <p className="text-[10px] text-[#3a3530]">Apenas quem você segue aparece aqui</p>
                </div>
              )}
              {filteredPatrons.map((p) => {
                const isTagged = taggedUsers.includes(p.username);
                return (
                  <button
                    key={p.userId}
                    type="button"
                    onClick={() => toggleTagUser(p.username)}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all text-left cursor-pointer ${
                      isTagged
                        ? 'bg-[#F5A623]/[0.08] hover:bg-[#F5A623]/[0.13]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={p.name}
                        className={`w-11 h-11 rounded-2xl object-cover transition-all ${
                          isTagged ? 'ring-2 ring-[#F5A623] ring-offset-1 ring-offset-[#0e0c0a]' : ''
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-[#EDE9E4] block leading-snug">{p.name}</span>
                      <span className="text-[11px] text-[#5a5349]">@{p.username}</span>
                    </div>

                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isTagged
                        ? 'bg-[#F5A623]'
                        : 'border-2 border-[#3a3530]'
                    }`}>
                      {isTagged && (
                        <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-[#080706] stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
                          <path d="M1 5l3 3 7-7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-white/[0.05]">
              <button
                type="button"
                onClick={() => setShowFriendSelector(false)}
                className="w-full h-[48px] rounded-2xl font-black text-[13px] text-[#080807] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(110deg, #FFC928 0%, #FF8200 100%)',
                  boxShadow: '0 4px 20px rgba(255,160,0,0.25)',
                }}
              >
                {taggedUsers.length > 0
                  ? `Confirmar ${taggedUsers.length} marcad${taggedUsers.length === 1 ? 'o' : 'os'}`
                  : 'Fechar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
