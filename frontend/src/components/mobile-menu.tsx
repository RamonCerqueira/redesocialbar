'use client';

import { useEffect, useRef, useState } from 'react';
import { Expand, Utensils, X } from 'lucide-react';
import { MenuProduct, menuTags, menuPrice } from '@/lib/menu';
import './mobile-menu-grid.css';

type Category = { name: string; description?: string; items: MenuProduct[] };

function Tags({ item, compact = false }: { item: MenuProduct; compact?: boolean }) {
  const tags = menuTags(item);
  return <span className="dish-tags">{(compact ? tags.slice(0, 2) : tags).map(tag =>
    <span key={tag} className={tag === '2X' ? 'double' : tag === 'HOJE' ? 'today' : ''} title={tag === '2X' ? 'Dobrado' : undefined}>{tag}</span>
  )}</span>;
}

export function MobileMenu({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (activeCategory && !categories.some(category => category.name === activeCategory)) setActiveCategory(null);
  }, [categories, activeCategory]);
  useEffect(() => {
    if (!selected) return;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, [selected]);

  if (!categories.length) return <div className="dish-empty"><Utensils size={28}/><h3>Cardápio em preparação</h3><p>Em breve, as delícias da casa estarão aqui.</p></div>;

  return <div className="mobile-menu">
    <nav className="dish-category-nav" aria-label="Categorias do cardápio">
      <button type="button" aria-pressed={activeCategory === null} aria-controls="menu-categories" onClick={() => setActiveCategory(null)}>Todos</button>
      {categories.map((category, index) => <button key={`${category.name}-${index}`} type="button" aria-pressed={activeCategory === category.name} aria-controls="menu-categories" onClick={() => setActiveCategory(category.name)}>{category.name}</button>)}
    </nav>
    <p className="dish-hint">Toque na foto para ampliar e conhecer o prato.</p>
    <div id="menu-categories" aria-live="polite">
    {categories.filter(category => activeCategory === null || category.name === activeCategory).map((category, categoryIndex) => <section key={`${category.name}-${categoryIndex}`} className="dish-category">
      <header><h3>{category.name}</h3>{category.description && <p>{category.description}</p>}</header>
      {!category.items?.length && <p className="dish-hint">Ainda não há produtos nesta categoria.</p>}
      <ul className="dish-list">{(category.items || []).map((item, index) => <li key={`${item.name}-${index}`}>
        <button type="button" className="dish-card" onClick={() => setSelected(item)} aria-label={`Ver detalhes de ${item.name}`}>
          <span className="dish-photo">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy"/> : <Utensils size={28}/>}<span className="dish-expand"><Expand size={12}/></span></span>
          <span className="dish-summary"><span className="dish-name">{item.name}</span>{item.description && <span className="dish-description">{item.description}</span>}<Tags item={item} compact/><strong className="dish-price">{menuPrice(item.price)}</strong></span>
        </button>
      </li>)}</ul>
    </section>)}
    </div>
    <dialog ref={dialog} className="dish-dialog" aria-labelledby="dish-title" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      {selected && <article>
        <button type="button" autoFocus className="dish-close" aria-label="Fechar detalhes do produto" onClick={() => setSelected(null)}><X size={22}/></button>
        {selected.imageUrl && <img className="dish-full-photo" src={selected.imageUrl} alt={selected.name}/>}
        <div className="dish-details"><Tags item={selected}/><h2 id="dish-title">{selected.name}</h2><strong className="dish-price">{menuPrice(selected.price)}</strong>{selected.description && <p>{selected.description}</p>}
          {selected.tags?.includes('2X') && <p className="dish-double-note">{selected.tags.includes('HOJE') ? 'Dobrado só hoje.' : '2X: este produto é dobrado.'}</p>}
          {(selected.portion || selected.prepTime) && <p className="dish-extra">{[selected.portion, selected.prepTime].filter(Boolean).join(' · ')}</p>}
          {selected.isWeeklyPick && selected.weeklyPickNote && <blockquote>{selected.weeklyPickNote}</blockquote>}
        </div>
      </article>}
    </dialog>
  </div>;
}
