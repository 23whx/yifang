import dates from '@/content/content-dates.json';

/** When a page's content source last changed (YYYY-MM-DD), from scripts/update-content-dates.cjs. */
export function contentDate(key: `${'hub' | 'glossary' | 'history' | 'lesson'}:${string}`): string | undefined {
  return (dates as Record<string, string>)[key];
}
