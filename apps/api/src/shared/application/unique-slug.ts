import { Slug } from '../domain/slug.js';

/** Gera um slug livre: "casamento-ana", "casamento-ana-2", "casamento-ana-3"… */
export async function uniqueSlug(
  source: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<Slug> {
  const base = Slug.fromText(source);
  let candidate = base;
  for (let n = 2; await isTaken(candidate.value); n++) candidate = base.withSuffix(n);
  return candidate;
}
