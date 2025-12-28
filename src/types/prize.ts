export interface Prize {
  id: string;
  name: string;
  value?: number | null;
  currency?: string | null;
}

export const createEmptyPrize = (): Prize => ({
  id: crypto.randomUUID(),
  name: '',
  value: null,
  currency: null,
});

export const parsePrizes = (prizes: unknown, fallbackName?: string, fallbackValue?: number | null): Prize[] => {
  if (Array.isArray(prizes) && prizes.length > 0) {
    return prizes.map(p => ({
      id: p.id || crypto.randomUUID(),
      name: p.name || '',
      value: p.value ?? null,
      currency: p.currency ?? null,
    }));
  }
  
  // Fallback: create single prize from legacy fields
  return [{
    id: crypto.randomUUID(),
    name: fallbackName || '',
    value: fallbackValue ?? null,
    currency: null,
  }];
};

export const serializePrizes = (prizes: Prize[]): Array<{ id: string; name: string; value: number | null; currency: string | null }> => {
  return prizes.map(p => ({
    id: p.id,
    name: p.name.trim(),
    value: p.value || null,
    currency: p.currency || null,
  }));
};
