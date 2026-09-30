export function unseenFirst<T extends { id: string }>(items: T[], seen: ReadonlySet<string>): T[] {
  return [...items.filter(item => !seen.has(item.id)), ...items.filter(item => seen.has(item.id))];
}

export async function loadAllMoments<T extends { id: string }>(fetchPage: (cursor?: string) => Promise<T[]>): Promise<T[]> {
  const result: T[] = [];
  const ids = new Set<string>();
  let cursor: string | undefined;
  while (true) {
    const page = await fetchPage(cursor);
    for (const item of page) if (!ids.has(item.id)) { ids.add(item.id); result.push(item); }
    const next = page.at(-1)?.id;
    if (page.length < 100 || !next || next === cursor) return result;
    cursor = next;
  }
}
