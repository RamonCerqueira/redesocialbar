'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Message } from '@/lib/types';
import { ArrowLeft, Send, Sparkles, ShieldAlert } from 'lucide-react';
import { ReportModal } from '@/components/report-modal';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatConversationPage({ params }: ChatPageProps) {
  const { id: conversationId } = React.use(params);
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const data = await apiRequest<{
        otherUser: any;
        messages: Message[];
      }>(`/chat/conversations/${conversationId}/messages`);
      setOtherUser(data.otherUser);
      setMessages(data.messages);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const newMessage = await apiRequest<Message>(
        `/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        },
      );
      setMessages((prev) => [...prev, newMessage]);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] surface-elevated rounded-3xl border border-amber-500/20 overflow-hidden glow-amber-sm">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#2C221A] flex items-center justify-between bg-[#13100E]">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 rounded-xl hover:bg-[#1E1814] text-[#A89F96] hover:text-[#FBF8F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {otherUser ? (
            <Link
              href={`/perfil/${otherUser.username}`}
              className="flex items-center gap-2.5 group"
            >
              <img
                src={
                  otherUser.avatarUrl ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                }
                alt={otherUser.name}
                className="w-10 h-10 rounded-2xl object-cover border border-amber-500/40"
              />
              <div>
                <h3 className="font-display font-bold text-sm text-[#FBF8F5] group-hover:text-amber-400 transition-colors">
                  {otherUser.name}
                </h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 indicator-pulse-emerald" />
                  No Pirambeira agora
                </span>
              </div>
            </Link>
          ) : (
            <span className="font-display font-bold text-sm text-[#FBF8F5]">Conversa</span>
          )}
        </div>

        {otherUser && (
          <button
            onClick={() => setShowReport(true)}
            className="p-2 text-[#6E655D] hover:text-red-400 rounded-xl hover:bg-[#1E1814] transition-colors"
            title="Denunciar Usuário"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
        {isLoading ? (
          <p className="text-xs text-[#6E655D] text-center py-6">Carregando conversa...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2.5">
            <div className="w-12 h-12 rounded-2xl amber-gradient mx-auto flex items-center justify-center text-[#080706] shadow-lg glow-amber-sm">
              <Sparkles className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="font-display font-black text-base text-[#FBF8F5]">Vocês deram match no Piramba!</h4>
            <p className="text-xs text-[#A89F96] max-w-xs mx-auto leading-relaxed">
              Quebre o gelo! Convide para um Chopp Brahma gelado ou puxe assunto sobre o samba de hoje.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-medium ${
                  m.isMine
                    ? 'amber-gradient text-[#080706] font-bold shadow-md glow-amber-sm'
                    : 'bg-[#1C1714] text-[#FBF8F5] border border-[#2C221A]'
                }`}
              >
                {m.content}
              </div>
              <span className="text-[9px] text-[#6E655D] px-1 mt-1 font-mono">
                {new Date(m.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 bg-[#13100E] border-t border-[#2C221A] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Envie uma mensagem na mesa..."
          className="flex-1 bg-[#18130F] border border-[#2C221A] rounded-2xl px-4 py-2.5 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="py-2.5 px-4 rounded-2xl amber-gradient text-[#080706] font-bold shadow-md glow-amber-sm disabled:opacity-40 active:scale-95 transition-transform cursor-pointer"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

      {/* Report Modal */}
      {otherUser && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          targetType="USER"
          targetId={otherUser.id}
        />
      )}
    </div>
  );
}
