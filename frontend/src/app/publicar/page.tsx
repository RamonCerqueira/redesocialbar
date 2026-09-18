'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MOCK_PATRONS } from '@/lib/mock-data';
import { submitPost } from '@/lib/publish/publish.actions';
import { PostModel } from '@/lib/publish/post.schema';
import screenConfig from '@/lib/publish/publish-screen.json';
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
  const { user } = useAuth();
  const config = screenConfig.screen;

  // Apenas o bar oficial pode postar vídeos curtos de 30s
  const isBarAdmin =
    user?.role === 'RESTAURANT_ADMIN' ||
    user?.role === 'SUPERADMIN' ||
    user?.profile?.username === 'pirambeira.bar';

  // Media state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80'
  );
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [showMediaTypeDropdown, setShowMediaTypeDropdown] = useState(false);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

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

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Camera helpers
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setIsCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsCameraActive(false);
      cameraInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 720;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    if (cameraFacing === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setSelectedPhoto(dataUrl);
    setMediaType('photo');
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      if (!isBarAdmin) {
        alert('Apenas a conta oficial do bar pode postar vídeos curtos de até 30s. Clientes podem compartilhar fotos!');
        e.target.value = '';
        return;
      }
      setMediaType('video');
    } else {
      setMediaType('photo');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedPhoto(event.target?.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
    if (isSubmitting) return;

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

  const filteredPatrons = MOCK_PATRONS.filter((p) => {
    const q = friendSearch.toLowerCase().replace('@', '');
    return p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-md mx-auto pb-12 space-y-4 text-[#FBF8F5]">
      {/* Hidden file and camera inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept={isBarAdmin ? 'image/*,video/*' : 'image/*'}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. HEADER: Voltar + "Registrar Momento" + Badge de Check-in */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-[#A89F96] hover:text-[#FBF8F5] transition-colors active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h1 className="font-display font-black text-xl text-[#FBF8F5] tracking-tight">
            Registrar Momento
          </h1>
        </div>

        {/* Check-in Active Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18130F] border border-amber-500/30 text-left shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 indicator-pulse-emerald" />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-[#FBF8F5] block">
              Pirambeira
            </span>
            <span className="text-[9px] text-amber-400 font-extrabold block">
              Check-in ativo
            </span>
          </div>
        </div>
      </div>

      {/* 2. MEDIA: Foto ou Câmera Imersiva com Controles */}
      <div className="surface-elevated rounded-3xl p-3 border border-amber-500/20 space-y-3">
        {/* Case A: Camera is Active */}
        {isCameraActive ? (
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#2C221A]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* Camera Overlay Controls */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={stopCamera}
                className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Shutter button */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-10">
              <button
                type="button"
                onClick={takeSnapshot}
                className="w-14 h-14 rounded-full border-4 border-amber-400 flex items-center justify-center p-1 active:scale-90 transition-transform bg-black/40 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-full bg-amber-400 shadow-lg glow-amber-sm" />
              </button>
            </div>
          </div>
        ) : selectedPhoto ? (
          /* Case B: Photo or Video Selected / Uploaded */
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black border border-[#2C221A] group">
            {mediaType === 'video' ? (
              <video
                src={selectedPhoto}
                autoPlay
                playsInline
                loop
                muted
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={selectedPhoto}
                alt="Foto do Post"
                className="w-full h-full object-cover"
              />
            )}

            {/* Top Controls: Media type badge & "X" remove */}
            <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
              {isBarAdmin ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMediaTypeDropdown(!showMediaTypeDropdown)}
                    className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 hover:bg-black/90 transition-colors"
                  >
                    {mediaType === 'video' ? (
                      <Video className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Camera className="w-3 h-3 text-amber-400" />
                    )}
                    <span>{mediaType === 'video' ? 'Vídeo (30s)' : 'Foto'}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {showMediaTypeDropdown && (
                    <div className="absolute left-0 mt-1 py-1 w-36 rounded-xl bg-[#18130F] border border-[#2C221A] shadow-2xl z-30 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaType('photo');
                          setShowMediaTypeDropdown(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-[#FBF8F5] hover:bg-[#241B15] flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaType('video');
                          setShowMediaTypeDropdown(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-[#FBF8F5] hover:bg-[#241B15] flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-amber-400" />
                        Vídeo (30s)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                  <Camera className="w-3 h-3 text-amber-400" />
                  <span>Foto</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 transition-colors border border-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons: "Tirar foto" & "Escolher da galeria" */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => startCamera('environment')}
            className="py-3 px-4 rounded-2xl amber-gradient text-[#080706] font-black text-xs flex items-center justify-center gap-2 shadow-md glow-amber-sm active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Tirar foto</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3 px-4 rounded-2xl bg-[#18130F] hover:bg-[#241B15] active:scale-95 text-[#FBF8F5] border border-[#2C221A] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>{isBarAdmin ? 'Galeria / Vídeo' : 'Galeria'}</span>
          </button>
        </div>

        {/* Info pill for regular patrons explaining video policy */}
        {!isBarAdmin && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#18130F] border border-[#2C221A] text-xs text-[#A89F96]">
            <div className="w-6 h-6 rounded-xl bg-amber-500/15 flex items-center justify-center text-[#F5A623] shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="leading-tight">
              Vídeos curtos de 30s são exclusivos para a conta oficial do bar. Patrões e clientes compartilham fotos da noite!
            </span>
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

      {/* 4. CAPTION BOX: "O que está rolando?" */}
      <div className="surface-elevated rounded-3xl p-4 border border-amber-500/15 space-y-2 focus-within:border-amber-500/40 transition-colors">
        <textarea
          rows={3}
          maxLength={280}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="O que está rolando? Conta pra galera o que está acontecendo no Pirambeira..."
          className="w-full bg-transparent border-none text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none resize-none leading-relaxed font-medium"
        />
        <div className="text-right">
          <span className="text-[10px] text-[#6E655D] font-mono">
            {caption.length}/280
          </span>
        </div>
      </div>

      {/* 5. QUICK CHIPS: Amigos 🍻, Festa 🎉, Hoje 🔥, Música 🎵, Paquera ❤️ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5">
        {config.quickTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleQuickTag(tag.id)}
              className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${isSelected
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-[#18130F] text-[#A89F96] border border-[#2C221A] hover:border-[#382C23]'
                }`}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6. BOTÃO PUBLICAR */}
      <button
        type="button"
        onClick={handlePublish}
        disabled={isSubmitting || (!selectedPhoto && !caption.trim())}
        className="w-full py-4 px-6 rounded-2xl amber-gradient disabled:opacity-40 text-[#080706] font-display font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl glow-amber-lg active:scale-95 transition-all mt-2 cursor-pointer"
      >
        <Send className="w-4 h-4 stroke-[2.5]" />
        <span>{isSubmitting ? 'PUBLICANDO NO BAR...' : 'PUBLICAR MOMENTO'}</span>
      </button>

      {/* 7. MODAL DE AMIGOS DO BAR */}
      {showFriendSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="rounded-3xl p-5 w-full max-w-sm border border-amber-500/25 shadow-2xl surface-floating space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#2C221A]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-black text-sm text-[#FBF8F5]">Marcar Amigos da Mesa</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFriendSelector(false)}
                className="text-[#A89F96] hover:text-[#FBF8F5] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#6E655D] absolute left-3 top-2.5" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Buscar pelo @ ou nome..."
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 scrollbar-none">
              {filteredPatrons.map((p) => {
                const isTagged = taggedUsers.includes(p.username);
                return (
                  <button
                    key={p.userId}
                    type="button"
                    onClick={() => toggleTagUser(p.username)}
                    className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-colors ${isTagged
                      ? 'bg-amber-500/15 border border-amber-500/40'
                      : 'hover:bg-[#1C1714]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={p.name}
                        className="w-8 h-8 rounded-xl object-cover border border-[#2C221A]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#FBF8F5] block">{p.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono">@{p.username}</span>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${isTagged ? 'bg-amber-400 text-[#080706]' : 'border border-[#6E655D]'
                        }`}
                    >
                      {isTagged && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={() => setShowFriendSelector(false)}
              className="w-full py-2.5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs active:scale-95 transition-transform cursor-pointer"
            >
              Concluir ({taggedUsers.length} selecionado{taggedUsers.length === 1 ? '' : 's'})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
