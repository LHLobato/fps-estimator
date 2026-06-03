/** Filtro local para lista fixa de RAM (poucos itens, sem endpoint). */
export function filterRamOptions(options, searchTerm, limit = 10) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  const words = term.split(/\s+/);

  const scored = options.map((item) => {
    const itemLower = item.toLowerCase();
    let score = 0;

    if (itemLower.startsWith(term)) {
      score += 1000;
    }

    words.forEach((word) => {
      if (itemLower.startsWith(word)) {
        score += 500;
      } else if (itemLower.includes(word)) {
        score += 100;
      }
    });

    return { item, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
