export interface MenuProduct {
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  tags?: string[];
  isChefPick?: boolean;
  isPromo?: boolean;
  isNew?: boolean;
  isWeeklyPick?: boolean;
  weeklyPickNote?: string;
  portion?: string;
  prepTime?: string;
}

export function menuPrice(price: string): string {
  return /^R\$/i.test(price.trim()) ? price.trim() : `R$ ${price.trim()}`;
}

export function menuTags(item: MenuProduct): string[] {
  const tags = item.tags || [];
  return [...new Set([
    ...['2X', 'HOJE'].filter(tag => tags.includes(tag)),
    ...(item.isChefPick ? ['DO CHEF'] : []),
    ...(item.isPromo ? ['DESCONTO'] : []),
    ...(item.isNew ? ['NOVO'] : []),
    ...(item.isWeeklyPick ? ['DA SEMANA'] : []),
    ...tags,
  ])];
}
