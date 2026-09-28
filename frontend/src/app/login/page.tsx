'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Beer, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.token, data.user);
      router.replace(data.user.mustChangePassword ? '/primeiro-acesso' : data.user.role === 'RESTAURANT_ADMIN' || data.user.role === 'SUPERADMIN' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na conta.');
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
          Entrar no Tô no Piramba
        </h1>
        <p className="text-xs text-[#A89F96]">
          Sua comunidade exclusiva no Restaurante Pirambeira • Pituba, Salvador.
        </p>
      </div>

      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/25 glow-amber-sm">
        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-[#FBF8F5] mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
              <input
                type="email"
                id="login-email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-[#FBF8F5] mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
              <input
                type="password"
                id="login-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider shadow-lg glow-amber-sm active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? 'Entrando...' : 'Entrar no Bar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-5 mt-5 border-t border-[#2C221A] text-center">
          <p className="text-xs text-[#A89F96]">
            Ainda não tem cadastro?{' '}
            <Link href="/cadastro" className="text-amber-400 font-bold hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
