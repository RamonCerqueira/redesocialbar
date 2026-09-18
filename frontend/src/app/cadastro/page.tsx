'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Beer, Lock, Mail, User, AtSign, MapPin, ArrowRight } from 'lucide-react';

export default function CadastroPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Salvador, BA');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState('');

  const checkUsernameTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(raw);

    if (checkUsernameTimerRef.current) {
      clearTimeout(checkUsernameTimerRef.current);
    }

    if (!raw || raw.length < 3) {
      setUsernameAvailable(null);
      setUsernameFeedback(raw.length > 0 ? 'O nome deve ter no mínimo 3 caracteres.' : '');
      return;
    }

    setIsCheckingUsername(true);
    checkUsernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiRequest<{ available: boolean; message: string }>(
          `/auth/check-username/${encodeURIComponent(raw)}`,
        );
        setUsernameAvailable(res.available);
        setUsernameFeedback(res.message);
      } catch {
        setUsernameAvailable(true);
        setUsernameFeedback(`@${raw} está disponível.`);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameAvailable === false) {
      setError('Este @ de Pirambeiro já está em uso por outro frequentador. Escolha outro nome!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          city,
          bio,
        }),
      });
      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-24 h-24 mx-auto flex items-center justify-center mb-1">
          <img
            src="/LogoPirambeiraSemFundo.png"
            alt="Pirambeira Bar"
            className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(245,166,35,0.3)]"
          />
        </div>
        <h1 className="font-display font-black text-2xl text-[#FBF8F5] tracking-tight">
          Criar sua Conta no Piramba
        </h1>
        <p className="text-xs text-[#A89F96]">
          Faça parte da comunidade viva do Restaurante Pirambeira • Salvador, BA.
        </p>
      </div>

      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/25 glow-amber-sm">
        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mariana Couto"
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#FBF8F5]">
                Nome do Pirambeiro(a) (@)
              </label>
              {username.trim().length >= 3 && (
                <span
                  className={`text-[10px] font-bold flex items-center gap-1 ${
                    usernameAvailable === true
                      ? 'text-emerald-400'
                      : usernameAvailable === false
                      ? 'text-rose-400'
                      : 'text-[#A89F96]'
                  }`}
                >
                  {isCheckingUsername
                    ? 'Verificando...'
                    : usernameAvailable === true
                    ? '✓ Disponível'
                    : usernameAvailable === false
                    ? '✕ Já em uso'
                    : ''}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="text-[#6E655D] absolute left-3.5 top-2.5 text-xs font-bold font-mono">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={handleUsernameChange}
                placeholder="Ex: MarianaSalvador"
                className={`w-full bg-[#18130F] border rounded-2xl pl-8 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none transition-colors font-medium ${
                  usernameAvailable === false
                    ? 'border-rose-500/70 focus:border-rose-500'
                    : usernameAvailable === true
                    ? 'border-emerald-500/70 focus:border-emerald-500'
                    : 'border-[#2C221A] focus:border-amber-500'
                }`}
              />
            </div>
            {usernameFeedback && (
              <p
                className={`text-[10px] mt-1 font-medium ${
                  usernameAvailable === false ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {usernameFeedback}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
              Cidade / Bairro
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Pituba, Salvador - BA"
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
              Bio Rápida (opcional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ex: Curto chopp artesanal trincando, samba no final de tarde e boa conversa."
              className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl p-3 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 resize-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider shadow-lg glow-amber-sm active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{isLoading ? 'Criando Perfil...' : 'Criar Perfil e Entrar no Bar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 mt-4 border-t border-[#2C221A] text-center">
          <p className="text-xs text-[#A89F96]">
            Já possui uma conta?{' '}
            <Link href="/login" className="text-amber-400 font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
