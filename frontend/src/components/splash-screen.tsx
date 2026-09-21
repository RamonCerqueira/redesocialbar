'use client';

import React, { useState, useEffect, useId } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const uniqueId = useId().replace(/:/g, '');

  // Duração total calibrada em 10 segundos (conforme solicitado: 8 a 15 segundos)
  const TOTAL_DURATION_MS = 10000;

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / TOTAL_DURATION_MS) * 100));
      setProgress(pct);

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 700);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // Fase 1: 0% a 78% -> Dois copos enchendo juntos com chopp e espuma subindo
  // Fase 2: 79% a 100% -> Dois copos cheios fazem o brinde suave ("Tim-tim!") com brilho cinematográfico
  const isToasting = progress >= 79;

  // Altura do chopp (de y = 92 até y = 38 => 54px úteis de líquido)
  const fillProgress = Math.min(1, progress / 78);
  const fillHeight = Math.max(2, fillProgress * 54);
  const liquidY = 92 - fillHeight;
  const foamHeight = Math.min(14, 3 + fillProgress * 11);
  const foamY = Math.max(28, liquidY - foamHeight + 2);

  // Micro-mensagens de status elegantes e profissionais
  const getStatusText = () => {
    if (progress < 25) return 'Preparando a casa...';
    if (progress < 55) return 'Tirando aquele chopp gelado...';
    if (progress < 79) return 'Colarinho cremoso no ponto...';
    return 'Um brinde ao Piramba! 🍻';
  };

  return (
    <div
      style={{ backgroundColor: '#000000' }}
      className={`fixed inset-0 z-[9999] bg-black flex flex-col justify-between items-center px-6 py-10 select-none overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Tela de carregamento Tô no Piramba"
    >
      {/* Estilos e Animações Fluidas de Nível Profissional */}
      <style>{`
        /* Brilho dourado metálico fluido na frase */
        @keyframes metallicGoldShimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        /* Inclinação suave e orgânica da caneca esquerda no brinde */
        @keyframes toastMugLeft {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          35% {
            transform: translate(7px, -3px) rotate(4.8deg);
          }
          65% {
            transform: translate(5px, -1px) rotate(3.8deg);
          }
          100% {
            transform: translate(6px, -2px) rotate(4.2deg);
          }
        }

        /* Inclinação suave e orgânica da caneca direita no brinde */
        @keyframes toastMugRight {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          35% {
            transform: translate(-7px, -3px) rotate(-4.8deg);
          }
          65% {
            transform: translate(-5px, -1px) rotate(-3.8deg);
          }
          100% {
            transform: translate(-6px, -2px) rotate(-4.2deg);
          }
        }

        /* Pulsação do halo de luz dourada no momento do brinde */
        @keyframes bloomGlow {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          30% {
            opacity: 0.95;
            transform: scale(1.15);
          }
          70% {
            opacity: 0.6;
            transform: scale(1.0);
          }
          100% {
            opacity: 0.75;
            transform: scale(1.05);
          }
        }

        /* Anéis de vibração cristalina do vidro no brinde */
        @keyframes soundWaveRings {
          0% {
            r: 4;
            opacity: 0.9;
            stroke-width: 2.5;
          }
          100% {
            r: 26;
            opacity: 0;
            stroke-width: 0.5;
          }
        }

        /* Subida contínua e delicada das bolhinhas de chopp */
        @keyframes gentleBubble {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-36px);
            opacity: 0;
          }
        }

        /* Fluidez dinâmica do fluxo de chopp descendo */
        @keyframes fluidPour {
          0%, 100% {
            opacity: 0.82;
            transform: scaleX(0.92);
          }
          50% {
            opacity: 0.98;
            transform: scaleX(1.08);
          }
        }
      `}</style>

      {/* Espaçador Superior Equilibrado */}
      <div className="w-full h-4" />

      {/* Bloco Central Nobre: Logo Oficial + Tipografia Exclusiva + Canecas de Chopp */}
      <div className="flex flex-col items-center justify-center text-center max-w-sm w-full my-auto space-y-6">
        {/* 1. LOGO PIRAMBEIRA (GRANDE, NÍTIDA, 100% ESTÁTICA E SEM HALO/GLOW) */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <img
            src="/LogoPirambeira.png"
            alt="Pirambeira Bar"
            className="w-full h-full object-contain select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* 2. FRASE "Vem pro Piramba!" COM TEXTO DOURADO METÁLICO CINTILANTE */}
        <div className="space-y-1.5 px-4">
          <h1
            className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-transparent bg-clip-text select-none"
            style={{
              backgroundImage:
                'linear-gradient(110deg, #F5A623 0%, #FFF3D6 25%, #F5A623 50%, #B45309 75%, #F5A623 100%)',
              backgroundSize: '250% 100%',
              animation: 'metallicGoldShimmer 4s ease-in-out infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Vem pro Piramba!
          </h1>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-400/90 select-none">
            Bar & Rede Social • Salvador
          </p>
        </div>

        {/* 3. ANIMAÇÃO DE REQUINTE: DUAS CANECAS DE VIDRO LAPIDADO ENCHENDO E BRINDANDO */}
        <div className="relative pt-1 flex flex-col items-center justify-center">
          <div className="relative w-56 h-28 flex items-center justify-center">
            <svg
              width="210"
              height="115"
              viewBox="0 0 210 115"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible select-none"
            >
              <defs>
                {/* Gradiente Realista de Chopp Dourado / Âmbar */}
                <linearGradient id={`beerLiquidGrad_${uniqueId}`} x1="0" y1="35" x2="0" y2="95" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FED774" />
                  <stop offset="30%" stopColor="#F5A623" />
                  <stop offset="70%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#873507" />
                </linearGradient>

                {/* Gradiente da Espuma Aveludada */}
                <linearGradient id={`foamGrad_${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="75%" stopColor="#FAF7F2" />
                  <stop offset="100%" stopColor="#EFE5D8" />
                </linearGradient>

                {/* Gradiente Suave de Vidro / Brilho */}
                <linearGradient id={`glassReflection_${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
                </linearGradient>

                {/* Jato de Chopp Gradual */}
                <linearGradient id={`pourGrad_${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5A623" stopOpacity="0" />
                  <stop offset="40%" stopColor="#F5A623" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFC84D" stopOpacity="0.95" />
                </linearGradient>

                {/* Recorte Interno da Caneca Esquerda */}
                <clipPath id={`leftMugInside_${uniqueId}`}>
                  <path d="M 45 35 H 85 L 81 92 C 81 95 78 97 74 97 H 56 C 52 97 49 95 49 92 Z" />
                </clipPath>

                {/* Recorte Interno da Caneca Direita */}
                <clipPath id={`rightMugInside_${uniqueId}`}>
                  <path d="M 125 35 H 165 L 161 92 C 161 95 158 97 154 97 H 136 C 132 97 129 95 129 92 Z" />
                </clipPath>

                {/* Filtro de Glow Sofisticado para o Brinde */}
                <filter id={`toastGlowFilter_${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* JATOS DE CHOPP DESCENDO COM FADE SUAVE (ENQUANTO ENCHEM) */}
              {!isToasting && (
                <g style={{ animation: 'fluidPour 0.8s ease-in-out infinite' }}>
                  {/* Jato Esquerdo */}
                  <rect
                    x="63.5"
                    y="0"
                    width="3"
                    height={Math.max(10, liquidY + 2)}
                    rx="1.5"
                    fill={`url(#pourGrad_${uniqueId})`}
                  />
                  {/* Jato Direito */}
                  <rect
                    x="143.5"
                    y="0"
                    width="3"
                    height={Math.max(10, liquidY + 2)}
                    rx="1.5"
                    fill={`url(#pourGrad_${uniqueId})`}
                  />
                </g>
              )}

              {/* ================= CANECA ESQUERDA ================= */}
              <g
                style={{
                  transformOrigin: '65px 95px',
                  animation: isToasting
                    ? 'toastMugLeft 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                    : 'none',
                }}
              >
                {/* Alça Ergonômica */}
                <path
                  d="M 44 47 C 28 47 24 57 24 68 C 24 79 28 88 44 88"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Fundo do Vidro Escuro Translúcido */}
                <path
                  d="M 43 32 H 87 L 82 94 C 82 97 78 100 74 100 H 56 C 52 100 48 97 48 94 Z"
                  fill="#0D0B0A"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.2"
                />

                {/* Base Maciça da Caneca */}
                <path
                  d="M 47 96 H 83 C 84 100 81 103 76 103 H 54 C 49 103 46 100 47 96 Z"
                  fill="#151210"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1.2"
                />

                {/* Chopp Enchendo (com máscara interna) */}
                <g clipPath={`url(#leftMugInside_${uniqueId})`}>
                  <rect
                    x="42"
                    y={liquidY}
                    width="46"
                    height={fillHeight + 10}
                    fill={`url(#beerLiquidGrad_${uniqueId})`}
                  />

                  {/* Micro-bolhas Subindo */}
                  <circle cx="54" cy="80" r="1.1" fill="rgba(255,255,255,0.7)" style={{ animation: 'gentleBubble 1.7s ease-in infinite' }} />
                  <circle cx="65" cy="88" r="1.4" fill="rgba(255,255,255,0.85)" style={{ animation: 'gentleBubble 2.1s ease-in infinite 0.4s' }} />
                  <circle cx="73" cy="82" r="1.0" fill="rgba(255,255,255,0.65)" style={{ animation: 'gentleBubble 1.9s ease-in infinite 0.9s' }} />
                </g>

                {/* Colarinho de Espuma Orgânico e Cremoso */}
                <g>
                  <path
                    d={`
                      M 44 ${liquidY + 1}
                      C 44 ${foamY} 50 ${foamY - 2} 56 ${foamY + 1}
                      C 62 ${foamY - 3} 70 ${foamY - 2} 76 ${foamY + 1}
                      C 81 ${foamY - 2} 86 ${foamY} 86 ${liquidY + 1}
                      C 86 ${liquidY + 6} 78 ${liquidY + 6} 65 ${liquidY + 5}
                      C 52 ${liquidY + 6} 44 ${liquidY + 6} 44 ${liquidY + 1}
                      Z
                    `}
                    fill={`url(#foamGrad_${uniqueId})`}
                  />
                  {/* Pequena gota cremosa escorrendo suavemente no topo se cheio */}
                  {progress > 82 && (
                    <ellipse cx="46" cy={liquidY + 4} rx="1.8" ry="3.5" fill="#FFFFFF" opacity="0.9" />
                  )}
                </g>

                {/* Facetas Lapidadas e Reflexos de Luz no Vidro */}
                <line x1="55" y1="36" x2="56" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="65" y1="36" x2="65" y2="92" stroke="rgba(255,255,255,0.24)" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="75" y1="36" x2="74" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" />
                <ellipse cx="65" cy="32" rx="21" ry="3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
              </g>

              {/* ================= CANECA DIREITA ================= */}
              <g
                style={{
                  transformOrigin: '145px 95px',
                  animation: isToasting
                    ? 'toastMugRight 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                    : 'none',
                }}
              >
                {/* Alça Ergonômica */}
                <path
                  d="M 166 47 C 182 47 186 57 186 68 C 186 79 182 88 166 88"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Fundo do Vidro Escuro Translúcido */}
                <path
                  d="M 123 32 H 167 L 162 94 C 162 97 158 100 154 100 H 136 C 132 100 128 97 128 94 Z"
                  fill="#0D0B0A"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.2"
                />

                {/* Base Maciça da Caneca */}
                <path
                  d="M 127 96 H 163 C 164 100 161 103 156 103 H 134 C 129 103 126 100 127 96 Z"
                  fill="#151210"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1.2"
                />

                {/* Chopp Enchendo (com máscara interna) */}
                <g clipPath={`url(#rightMugInside_${uniqueId})`}>
                  <rect
                    x="122"
                    y={liquidY}
                    width="46"
                    height={fillHeight + 10}
                    fill={`url(#beerLiquidGrad_${uniqueId})`}
                  />

                  {/* Micro-bolhas Subindo */}
                  <circle cx="134" cy="82" r="1.1" fill="rgba(255,255,255,0.7)" style={{ animation: 'gentleBubble 1.8s ease-in infinite 0.2s' }} />
                  <circle cx="145" cy="89" r="1.4" fill="rgba(255,255,255,0.85)" style={{ animation: 'gentleBubble 2.2s ease-in infinite 0.6s' }} />
                  <circle cx="153" cy="83" r="1.0" fill="rgba(255,255,255,0.65)" style={{ animation: 'gentleBubble 1.7s ease-in infinite 1.1s' }} />
                </g>

                {/* Colarinho de Espuma Orgânico e Cremoso */}
                <g>
                  <path
                    d={`
                      M 124 ${liquidY + 1}
                      C 124 ${foamY} 130 ${foamY - 2} 136 ${foamY + 1}
                      C 142 ${foamY - 3} 150 ${foamY - 2} 156 ${foamY + 1}
                      C 161 ${foamY - 2} 166 ${foamY} 166 ${liquidY + 1}
                      C 166 ${liquidY + 6} 158 ${liquidY + 6} 145 ${liquidY + 5}
                      C 132 ${liquidY + 6} 124 ${liquidY + 6} 124 ${liquidY + 1}
                      Z
                    `}
                    fill={`url(#foamGrad_${uniqueId})`}
                  />
                  {/* Pequena gota cremosa escorrendo suavemente no topo se cheio */}
                  {progress > 82 && (
                    <ellipse cx="164" cy={liquidY + 4} rx="1.8" ry="3.5" fill="#FFFFFF" opacity="0.9" />
                  )}
                </g>

                {/* Facetas Lapidadas e Reflexos de Luz no Vidro */}
                <line x1="135" y1="36" x2="136" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="145" y1="36" x2="145" y2="92" stroke="rgba(255,255,255,0.24)" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="155" y1="36" x2="154" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" />
                <ellipse cx="145" cy="32" rx="21" ry="3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
              </g>

              {/* ================= O BRINDE: HALO DOURADO CINEMATOGRÁFICO (>= 79%) ================= */}
              {isToasting && (
                <g transform="translate(105, 34)">
                  {/* Luz de Fundo Difusa */}
                  <circle
                    cx="0"
                    cy="0"
                    r="22"
                    fill="#F5A623"
                    opacity="0.35"
                    filter={`url(#toastGlowFilter_${uniqueId})`}
                    style={{ animation: 'bloomGlow 0.6s ease-out forwards' }}
                  />

                  {/* Onda de Som Cristalina Discreta */}
                  <circle
                    cx="0"
                    cy="0"
                    r="6"
                    stroke="#FFD774"
                    fill="none"
                    style={{ animation: 'soundWaveRings 0.7s ease-out forwards' }}
                  />

                  {/* Núcleo de Contato */}
                  <circle
                    cx="0"
                    cy="0"
                    r="3"
                    fill="#FFFFFF"
                    style={{ animation: 'bloomGlow 0.5s ease-out forwards' }}
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Subtítulo dinâmico sutil e de bom gosto */}
          <span className="text-[11px] font-medium text-amber-200/80 tracking-wide mt-1 select-none">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Rodapé Minimalista: Barra de Progresso Fina e Porcentagem Tabular */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-3 pb-2">
        {/* Barra de Progresso Ultra-Clean */}
        <div className="w-52 h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #D97706 0%, #F5A623 70%, #FFE29A 100%)',
              boxShadow: '0 0 10px rgba(245, 166, 35, 0.4)',
            }}
          />
        </div>

        {/* Informações Numéricas com Alinhamento Perfeito */}
        <div className="flex items-center justify-between w-52 text-[10px] uppercase font-semibold tracking-wider text-neutral-400 select-none">
          <span>{isToasting ? 'Carregado' : 'Entrando'}</span>
          <span className="font-mono text-amber-400 font-bold tabular-nums">{progress}%</span>
        </div>

        {/* Opção Discreta de Toque para Pular */}
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => setIsVisible(false), 400);
          }}
          className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-200 transition-colors pt-1 cursor-pointer select-none"
        >
          Toque para entrar direto
        </button>
      </div>
    </div>
  );
}

