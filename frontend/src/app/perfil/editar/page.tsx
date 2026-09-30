'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Lock,
  MapPin,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, uploadImage } from '@/lib/api';
import '../profile.css';
import { PhotoEditor } from '@/components/photo-editor';
import { photoFromFile } from '@/lib/camera-photo';

export default function EditProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const initialized = useRef('');

  const [form, setForm] = useState({
    name: '',
    bio: '',
    city: '',
    avatarUrl: '',
    showInFlirtRadar: true,
    invisibleMode: false,
    isPrivate: false,
    allowFlirtFrom: 'EVERYONE',
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestSearch, setInterestSearch] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Sugestões populares para boteco/bar e vida noturna
  const POPULAR_INTERESTS = [
    'Chopp Brahma',
    'Cerveja Artesanal',
    'IPA',
    'Caipirinha',
    'Gin Tônica',
    'Vinho',
    'Drinks Autorais',
    'Samba',
    'Samba de Roda',
    'Pagode',
    'MPB',
    'Rock',
    'Música ao Vivo',
    'Gastronomia',
    'Petiscos de Boteco',
    'Alta Gastronomia',
    'Culinária Baiana',
    'Futebol',
    'Stand Up',
    'Fotografia',
    'Happy Hour',
    'Tecnologia',
    'Games',
    'Viagens',
    'Praia',
    'Pets',
    'Dança',
    'Moda & Estilo',
    'Amizades',
    'Cinema & Séries'
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (initialized.current === user.id) return;
    initialized.current = user.id;
    const p = user.profile;
    setForm({
      name: p.name || '',
      bio: p.bio || '',
      city: p.city || '',
      avatarUrl: p.avatarUrl || '',
      showInFlirtRadar: p.showInFlirtRadar ?? true,
      invisibleMode: !!p.invisibleMode,
      isPrivate: !!p.isPrivate,
      allowFlirtFrom: p.allowFlirtFrom || 'EVERYONE',
    });
    setSelectedInterests(Array.isArray(p.interests) ? p.interests.slice(0, 10) : []);
  }, [user, isLoading, router]);

  async function selectPhoto(file?: File) {
    if (!file) return;
    setError('');
    try { setPendingPhoto(await photoFromFile(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a foto.'); }
  }

  function toggleInterest(item: string) {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (selectedInterests.includes(trimmed)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== trimmed));
    } else {
      if (selectedInterests.length >= 10) {
        setError('Você pode selecionar no máximo 10 interesses.');
        return;
      }
      setSelectedInterests([...selectedInterests, trimmed]);
      setError('');
    }
  }

  function addCustomInterest(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 40) {
      setError('O interesse deve ter no máximo 40 caracteres.');
      return;
    }
    if (selectedInterests.includes(trimmed)) {
      setInterestSearch('');
      return;
    }
    if (selectedInterests.length >= 10) {
      setError('Você pode selecionar no máximo 10 interesses.');
      return;
    }
    setSelectedInterests([...selectedInterests, trimmed]);
    setInterestSearch('');
    setError('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !user) return;
    setBusy(true);
    setError('');

    try {
      if (selectedInterests.length > 10) {
        throw new Error('Você pode selecionar no máximo 10 interesses.');
      }

      let avatarUrl = form.avatarUrl;
      if (photo) {
        avatarUrl = await uploadImage(photo);
        setForm((value) => ({ ...value, avatarUrl }));
        setPhoto(null);
      }

      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          bio: form.bio.trim(),
          city: form.city.trim(),
          interests: selectedInterests,
          avatarUrl,
        }),
      });

      await refreshUser();
      router.push(`/perfil/${encodeURIComponent(user.profile.username)}?saved=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar seu perfil.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="profile-page flex min-h-[50vh] flex-col items-center justify-center gap-3 text-neutral-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#ffba18] border-t-transparent" />
        <p className="text-sm">Carregando seu perfil…</p>
      </div>
    );
  }

  const back = `/perfil/${encodeURIComponent(user.profile.username)}`;
  const currentAvatar = photo || form.avatarUrl;

  const filteredPopular = POPULAR_INTERESTS.filter((item) =>
    item.toLowerCase().includes(interestSearch.trim().toLowerCase())
  );
  const showCreateOption =
    interestSearch.trim().length > 0 &&
    !POPULAR_INTERESTS.some((i) => i.toLowerCase() === interestSearch.trim().toLowerCase()) &&
    !selectedInterests.some((i) => i.toLowerCase() === interestSearch.trim().toLowerCase());

  return (
    <div className="profile-page edit-profile-view pb-16">
      {pendingPhoto && <PhotoEditor source={pendingPhoto} aspectRatio={1} circular onCancel={() => setPendingPhoto(null)} onConfirm={adjusted => { setPhoto(adjusted); setPendingPhoto(null); }} />}
      {/* Top Header */}
      <header className="profile-heading sticky top-0 z-10 bg-[#080807]/90 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-[#302a20]/60 sm:border-0 sm:static sm:bg-transparent">
        <Link href={back} className="profile-icon" aria-label="Voltar ao meu perfil">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black text-white">Editar Perfil</h1>
          <p className="text-xs text-[#a9a5a0]">@{user.profile.username}</p>
        </div>
        <div className="w-11" />
      </header>

      <form className="edit-profile-form mt-4" onSubmit={save}>
        <fieldset disabled={busy} className="edit-profile-fieldset">
          {/* Card 1: Avatar / Identidade Visual */}
          <section className="profile-card profile-card-hero">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-glow" />
              {currentAvatar ? (
                <img className="profile-avatar-large" src={currentAvatar} alt="Sua foto de perfil" />
              ) : (
                <div className="profile-avatar-large flex items-center justify-center font-bold text-3xl text-[#ffba18] bg-[#1a1610]">
                  {form.name ? form.name.slice(0, 1).toUpperCase() : user.profile.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="profile-avatar-badge"
                title="Trocar foto"
                aria-label="Trocar foto de perfil"
              >
                <Camera size={18} />
              </button>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              aria-label="Selecionar foto de perfil"
              onChange={(e) => {
                void selectPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <button
                type="button"
                className="profile-btn-pill primary"
                onClick={() => fileInput.current?.click()}
              >
                <Camera size={15} />
                Alterar foto
              </button>
              {currentAvatar && <button type="button" className="profile-btn-pill" onClick={() => setPendingPhoto(currentAvatar)}>Ajustar foto</button>}
              {(photo || form.avatarUrl) && (
                <button
                  type="button"
                  className="profile-btn-pill danger"
                  onClick={() => {
                    setPhoto(null);
                    setForm({ ...form, avatarUrl: '' });
                  }}
                >
                  <Trash2 size={15} />
                  Remover
                </button>
              )}
            </div>
            <span className="text-[11px] text-[#8e8576] mt-2 block text-center">
              JPEG, PNG ou WebP até 5 MB
            </span>
          </section>

          {/* Card 2: Dados Pessoais */}
          <section className="profile-card">
            <div className="profile-card-header">
              <User size={18} className="text-[#ffba18]" />
              <div>
                <h2>Informações Pessoais</h2>
                <p>Como as pessoas verão seu nome e sua presença no bar</p>
              </div>
            </div>

            <div className="profile-field-group">
              <div className="profile-field">
                <label htmlFor="name-input">Nome de exibição</label>
                <input
                  id="name-input"
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Seu nome ou apelido"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="profile-field">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio-input">Biografia</label>
                  <span className="text-[11px] text-[#716d68]">{form.bio.length}/500</span>
                </div>
                <textarea
                  id="bio-input"
                  maxLength={500}
                  rows={3}
                  placeholder="O que você mais curte fazer no Piramba, sua vibe ou drinks favoritos…"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="city-input">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#ffba18]" /> Cidade / Região
                  </span>
                </label>
                <input
                  id="city-input"
                  maxLength={120}
                  autoComplete="address-level2"
                  placeholder="Ex: São Paulo, SP"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Card 3: Interesses & Tags */}
          <section className="profile-card">
            <div className="profile-card-header">
              <Sparkles size={18} className="text-[#ffba18]" />
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h2>Gostos e Interesses</h2>
                  <p>Selecione tags para facilitar conexões e conversas no bar</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    selectedInterests.length === 10
                      ? 'bg-[#e52532]/20 text-[#ff8080] border-[#e52532]/40'
                      : 'bg-[#272017] text-[#ffba18] border-[#4a3a24]'
                  }`}
                >
                  {selectedInterests.length}/10
                </span>
              </div>
            </div>

            {/* Interesses Selecionados */}
            {selectedInterests.length > 0 ? (
              <div className="profile-field">
                <span className="text-[12px] font-semibold text-[#d8cfc0] block mb-1">
                  Seus interesses selecionados:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2a1e0c] text-[#ffba18] border border-[#ffba18]/60 hover:bg-[#3d1a1b] hover:text-[#ff8f8f] hover:border-[#e52532] transition-colors"
                      title="Clique para remover"
                    >
                      <span>#{interest}</span>
                      <X size={13} className="text-[#ffba18]/70 group-hover:text-[#ff8f8f]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8c8273] italic">
                Nenhum interesse selecionado ainda. Escolha abaixo ou busque os seus favoritos.
              </p>
            )}

            {/* Campo de Busca & Filtro */}
            <div className="profile-field mt-1">
              <label htmlFor="interest-search-input">Buscar ou adicionar interesse</label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#716d68] pointer-events-none"
                />
                <input
                  id="interest-search-input"
                  type="text"
                  className="pl-9 pr-8"
                  placeholder="Pesquise (ex: Samba, IPA, Vinho, Rock, Games...)"
                  value={interestSearch}
                  disabled={selectedInterests.length >= 10}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (interestSearch.trim()) addCustomInterest(interestSearch.trim());
                    }
                  }}
                />
                {interestSearch && (
                  <button
                    type="button"
                    onClick={() => setInterestSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#716d68] hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Botão de Adicionar Personalizado caso não encontre exatamente */}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={() => addCustomInterest(interestSearch)}
                  disabled={selectedInterests.length >= 10}
                  className="inline-flex items-center gap-1.5 self-start mt-1 text-xs text-[#ffba18] hover:underline"
                >
                  <Plus size={14} />
                  Adicionar "<strong>{interestSearch.trim()}</strong>" como novo interesse
                </button>
              )}
            </div>

            {/* Lista de Opções / Sugestões para Clicar */}
            <div className="profile-field mt-1">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8576] font-semibold block mb-1.5">
                {interestSearch.trim() ? 'Resultados da busca' : 'Sugestões populares de Boteco & Rolê'}
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[170px] overflow-y-auto p-1 rounded-xl bg-[#090806] border border-[#2b2216]">
                {filteredPopular.length > 0 ? (
                  filteredPopular.map((item) => {
                    const isSelected = selectedInterests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        disabled={!isSelected && selectedInterests.length >= 10}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#ffba18] text-[#120e06] font-bold shadow-sm'
                            : 'bg-[#18140f] text-[#c7bcac] border border-[#372b1a] hover:border-[#ffba18]/60 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                        {item}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#8c8273] p-2">
                    Nenhum interesse pré-definido com esse nome. Pressione Enter para adicionar como tag personalizada.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Card 4: Radar da Paquera & Interações */}
          <section className="profile-card">
            <div className="profile-card-header">
              <Flame size={18} className="text-[#ff7900]" />
              <div>
                <h2>Radar da Paquera</h2>
                <p>Controle como você interage e recebe paqueras no ambiente</p>
              </div>
            </div>

            <div className="profile-switch-row">
              <div className="profile-switch-info">
                <strong>Aparecer no Radar da Paquera</strong>
                <p>Permite que frequentadores te vejam na lista de paquera quando estiver no local.</p>
              </div>
              <label className="profile-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.showInFlirtRadar}
                  onChange={(e) => setForm({ ...form, showInFlirtRadar: e.target.checked })}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="profile-field mt-3">
              <label htmlFor="flirt-from-select" className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-[#ffba18]" /> Quem pode te enviar paqueras?
              </label>
              <select
                id="flirt-from-select"
                value={form.allowFlirtFrom}
                onChange={(e) => setForm({ ...form, allowFlirtFrom: e.target.value })}
              >
                <option value="EVERYONE">✨ Qualquer pessoa</option>
                <option value="FOLLOWERS">👥 Apenas meus seguidores</option>
                <option value="NONE">🚫 Ninguém (fechado para paqueras)</option>
              </select>
            </div>
          </section>

          {/* Card 5: Privacidade & Visibilidade */}
          <section className="profile-card">
            <div className="profile-card-header">
              <Lock size={18} className="text-[#ffba18]" />
              <div>
                <h2>Privacidade & Presença</h2>
                <p>Defina o nível de exposição das suas postagens e check-ins</p>
              </div>
            </div>

            <div className="profile-switch-row">
              <div className="profile-switch-info">
                <div className="flex items-center gap-1.5">
                  <Lock size={15} className="text-[#a9a5a0]" />
                  <strong>Perfil Privado (Ocultar publicações)</strong>
                </div>
                <p>Suas fotos e posts só ficarão visíveis para você no seu perfil.</p>
              </div>
              <label className="profile-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="profile-switch-row border-t border-[#2a2216] pt-3.5">
              <div className="profile-switch-info">
                <div className="flex items-center gap-1.5">
                  {form.invisibleMode ? (
                    <EyeOff size={15} className="text-[#e52532]" />
                  ) : (
                    <Eye size={15} className="text-[#00d084]" />
                  )}
                  <strong>Modo Invisível</strong>
                </div>
                <p>Não exibir seu perfil na lista de pessoas ativas/presentes no bar agora.</p>
              </div>
              <label className="profile-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.invisibleMode}
                  onChange={(e) => setForm({ ...form, invisibleMode: e.target.checked })}
                />
                <span className="slider" />
              </label>
            </div>
          </section>

          {/* Mensagem de Erro se houver */}
          {error && (
            <div role="alert" className="profile-error flex items-center gap-2">
              <span className="font-bold">Aviso:</span> {error}
            </div>
          )}

          {/* Barra de Ações / Salvar */}
          <div className="profile-form-footer">
            <Link className="profile-btn-ghost" href={back}>
              Cancelar
            </Link>
            <button type="submit" className="profile-btn-save" disabled={busy}>
              {busy ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#151006] border-t-transparent" />
                  Salvando…
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Perfil
                </>
              )}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

