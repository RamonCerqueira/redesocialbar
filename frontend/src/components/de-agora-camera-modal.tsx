'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Story } from '@/lib/types';
import {
  X,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Send,
  Sparkles,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DeAgoraCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

export function DeAgoraCameraModal({
  isOpen,
  onClose,
  onStoryCreated,
}: DeAgoraCameraModalProps) {
  const { user } = useAuth();

  // Estados da câmera
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Estados de captura e preview
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Iniciar câmera WebRTC ao abrir modal
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startWebcam(facingMode);
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isOpen, capturedImage, facingMode]);

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startWebcam = async (mode: 'environment' | 'user') => {
    stopWebcam();
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sem suporte a WebRTC');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Câmera WebRTC não disponível, acionando fallback nativo:', err);
      setCameraError('Câmera em tempo real indisponível. Use a câmera nativa ou galeria.');
    } finally {
      setIsStartingCamera(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Disparo da foto pelo viewfinder
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Efeito de Flash na tela estilo câmera
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Se estiver na câmera frontal, espelhar horizontalmente para parecer espelho
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopWebcam();
    setCapturedImage(dataUrl);
  };

  // Captura via input de arquivo / câmera nativa
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        stopWebcam();
        setCapturedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset para tirar outra foto
  const handleDiscard = () => {
    setCapturedImage(null);
    setCaption('');
  };

  // Publicar no De Agora
  const handlePublish = async () => {
    if (!capturedImage || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        mediaUrl: capturedImage,
        mediaType: 'IMAGE',
        caption: caption.trim() || undefined,
        restaurantSlug: 'pirambeira',
      };

      const res = await apiRequest<Story>('/stories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newStory: Story = res?.id
        ? res
        : {
            id: 'story-' + Date.now(),
            mediaUrl: capturedImage,
            mediaType: 'IMAGE',
            caption: caption.trim() || undefined,
            createdAt: new Date().toISOString(),
            author: {
              id: user?.id || 'user-me',
              name: user?.profile?.name || 'Você',
              username: user?.profile?.username || 'voce',
              avatarUrl: user?.profile?.avatarUrl || '/LogoPirambeiraSemFundo.png',
              isOfficial: user?.role === 'RESTAURANT_ADMIN' || user?.role === 'SUPERADMIN',
            },
          };

      onStoryCreated(newStory);
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar no De Agora');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopWebcam();
    setCapturedImage(null);
    setCaption('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Flash visual simulando obturador */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
      )}

      {/* Hidden inputs para fallback nativo e galeria */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* TELA 1: MODO CÂMERA AO VIVO */}
      {!capturedImage ? (
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Viewfinder da Câmera */}
          <div className="absolute inset-0 z-0 bg-[#080706] flex items-center justify-center overflow-hidden">
            {isStartingCamera ? (
              <div className="flex flex-col items-center gap-3 text-amber-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Iniciando câmera do Piramba...
                </span>
              </div>
            ) : cameraError ? (
              <div className="p-6 text-center max-w-xs space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-white font-bold text-sm">Abrir Câmera</h3>
                <p className="text-xs text-[#A89F96]">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-amber-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Usar Câmera do Celular</span>
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
            )}

            {/* Vinheta gradiente de proteção */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
          </div>

          {/* Top Bar Câmera */}
          <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer border border-white/10"
              aria-label="Fechar câmera"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Badge centralizado "De Agora" */}
            <div className="px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/30 flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 indicator-pulse-emerald" />
              <span className="font-display font-black text-xs text-amber-300 tracking-wider uppercase">
                De Agora • Piramba
              </span>
            </div>

            {/* Alternar frontal / traseira */}
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={Boolean(cameraError)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer border border-white/10 disabled:opacity-30"
              aria-label="Inverter câmera"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Bottom Bar: Disparador & Ações estilo Instagram */}
          <div className="relative z-10 p-6 pb-8 flex items-center justify-around">
            {/* Botão Galeria */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center hover:bg-white/20 transition-all active:scale-90 cursor-pointer shadow-lg"
              title="Escolher da Galeria"
            >
              <ImageIcon className="w-5 h-5 text-white" />
              <span className="text-[8px] font-bold mt-0.5 text-white/80">Galeria</span>
            </button>

            {/* Disparador Circular Estilo Instagram / WhatsApp */}
            <button
              type="button"
              onClick={cameraError ? () => nativeCameraInputRef.current?.click() : takeSnapshot}
              className="group relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90"
              aria-label="Tirar foto"
            >
              {/* Anel Externo Iluminado */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-400/90 shadow-[0_0_20px_rgba(245,166,35,0.6)] group-hover:scale-105 transition-transform" />
              {/* Botão Interno */}
              <div className="w-15 h-15 rounded-full bg-white group-active:bg-amber-300 transition-colors shadow-inner" />
            </button>

            {/* Disparo Direto Câmera Nativa do Celular */}
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center hover:bg-white/20 transition-all active:scale-90 cursor-pointer shadow-lg"
              title="Câmera do Celular"
            >
              <Camera className="w-5 h-5 text-amber-300" />
              <span className="text-[8px] font-bold mt-0.5 text-white/80">Nativo</span>
            </button>
          </div>
        </div>
      ) : (
        /* TELA 2: PREVIEW DA FOTO TIRADA & LEGENDA RÁPIDA */
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Foto Capturada em Tela Cheia */}
          <div className="absolute inset-0 z-0 bg-black">
            <img
              src={capturedImage}
              alt="Preview do De Agora"
              className="w-full h-full object-cover"
            />
            {/* Gradientes escuros para visibilidade dos controles */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />
          </div>

          {/* Top Bar Preview */}
          <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 hover:bg-black/80 transition-colors cursor-pointer border border-white/15"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Tirar outra</span>
            </button>

            <div className="px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-[11px] font-black text-[#F5A623] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurante Pirambeira</span>
            </div>
          </div>

          {/* Bottom Bar: Input de Legenda & Botão Publicar */}
          <div className="relative z-10 p-4 sm:p-6 space-y-3.5 max-w-md mx-auto w-full">
            {/* Caixa de Legenda Flutuante */}
            <div className="bg-[#120F0D]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-3 shadow-2xl space-y-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legenda do seu momento agora... (opcional)"
                maxLength={140}
                className="w-full bg-transparent px-3 py-1 text-sm text-white placeholder-[#8E867E] focus:outline-none font-medium"
                autoFocus
              />
              <div className="flex items-center justify-between px-2 text-[10px] text-[#A89F96] border-t border-white/10 pt-1.5">
                <span className="flex items-center gap-1 text-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Visível para a galera do bar
                </span>
                <span>{caption.length}/140</span>
              </div>
            </div>

            {/* Botão de Envio Estilo Instagram */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="w-full py-4 px-5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl glow-amber-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publicando no De Agora...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-current stroke-none" />
                  <span>Postar no De Agora</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
