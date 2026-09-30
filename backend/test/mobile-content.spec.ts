import { describe, expect, it } from 'vitest';
import { unseenFirst, loadAllMoments } from '../../frontend/src/lib/de-agora';
import { menuTags, menuPrice } from '../../frontend/src/lib/menu';

describe('Conteúdo mobile', () => {
  it('move vistos para o fim sem mudar a sequência do visualizador aberto', () => {
    const original = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const playback = unseenFirst(original, new Set(['a']));
    expect(playback.map(item => item.id)).toEqual(['b', 'c', 'a']);
    expect(unseenFirst(original, new Set(['a', 'b'])).map(item => item.id)).toEqual(['c', 'a', 'b']);
    expect(playback.map(item => item.id)).toEqual(['b', 'c', 'a']);
    expect(original.map(item => item.id)).toEqual(['a', 'b', 'c']);
  });
  it('carrega mais de 100 momentos sem duplicar publicações', async () => {
    const first = Array.from({ length: 100 }, (_, index) => ({ id: String(index) }));
    const cursors: (string | undefined)[] = [];
    const items = await loadAllMoments(async cursor => { cursors.push(cursor); return cursor ? [{ id: '99' }, { id: '100' }] : first; });
    expect(items).toHaveLength(101);
    expect(cursors).toEqual([undefined, '99']);
  });
  it('mantém 2X e HOJE juntos nos dois destaques, preservando selos existentes nos detalhes', () => {
    const tags = menuTags({ name: 'Chopp', price: '12,00', tags: ['HOJE', '2X', '2X'], isChefPick: true, isPromo: true });
    expect(tags.slice(0, 2)).toEqual(['2X', 'HOJE']);
    expect(tags).toEqual(['2X', 'HOJE', 'DO CHEF', 'DESCONTO']);
    expect(menuPrice('12,00')).toBe('R$ 12,00');
    expect(menuPrice('R$ 12,00')).toBe('R$ 12,00');
  });
});
