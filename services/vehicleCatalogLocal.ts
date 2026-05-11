/**
 * Repli client pour le catalogue véhicule lorsque la base ne contient qu’un sous-ensemble (seed minimal).
 * Identifiants préfixés — pas de FK Supabase ; création véhicule sans vehicle_catalog_model_id.
 */

export const LOCAL_BRAND_PREFIX = 'clb:';
export const LOCAL_MODEL_PREFIX = 'clm:';

type CatalogBrandRow = { id: string; name: string; sortOrder: number };
type CatalogModelRow = {
  id: string;
  brandId: string;
  name: string;
  yearFrom: number | null;
  yearTo: number | null;
};

type JsonModel = { brand: string; name: string; year_from: number | null; year_to: number | null };

function utf8ToB64Url(str: string): string {
  const utf8 = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < utf8.length; i++) bin += String.fromCharCode(utf8[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlToUtf8(b64: string): string {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const std = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(std);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function normalizeCatalogName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function makeLocalBrandId(brandName: string): string {
  return `${LOCAL_BRAND_PREFIX}${utf8ToB64Url(brandName)}`;
}

export function parseLocalBrandId(id: string): string | null {
  if (!id.startsWith(LOCAL_BRAND_PREFIX)) return null;
  try {
    return b64UrlToUtf8(id.slice(LOCAL_BRAND_PREFIX.length));
  } catch {
    return null;
  }
}

export type LocalCatalogModelMeta = {
  brandName: string;
  modelName: string;
  yearFrom: number | null;
  yearTo: number | null;
};

export function makeLocalModelId(meta: LocalCatalogModelMeta): string {
  const payload = JSON.stringify(meta);
  return `${LOCAL_MODEL_PREFIX}${utf8ToB64Url(payload)}`;
}

export function parseLocalCatalogModelMeta(id: string): LocalCatalogModelMeta | null {
  if (!id.startsWith(LOCAL_MODEL_PREFIX)) return null;
  try {
    const raw = b64UrlToUtf8(id.slice(LOCAL_MODEL_PREFIX.length));
    const o = JSON.parse(raw) as LocalCatalogModelMeta;
    if (!o || typeof o.brandName !== 'string' || typeof o.modelName !== 'string') return null;
    return {
      brandName: o.brandName,
      modelName: o.modelName,
      yearFrom: o.yearFrom ?? null,
      yearTo: o.yearTo ?? null,
    };
  } catch {
    return null;
  }
}

export function isLocalCatalogBrandId(id: string): boolean {
  return id.startsWith(LOCAL_BRAND_PREFIX);
}

export function isLocalCatalogModelId(id: string): boolean {
  return id.startsWith(LOCAL_MODEL_PREFIX);
}

function remoteBrandsByNormKey(rows: CatalogBrandRow[]): Map<string, CatalogBrandRow> {
  const m = new Map<string, CatalogBrandRow>();
  for (const r of rows) {
    m.set(normalizeCatalogName(r.name), r);
  }
  return m;
}

let brandsJsonPromise: Promise<string[]> | null = null;
function loadBrandNames(): Promise<string[]> {
  if (!brandsJsonPromise) {
    brandsJsonPromise = import('../data/vehicle-catalog-brands.json').then((m) => m.default as string[]);
  }
  return brandsJsonPromise;
}

let modelsJsonPromise: Promise<JsonModel[]> | null = null;
function loadAllModels(): Promise<JsonModel[]> {
  if (!modelsJsonPromise) {
    modelsJsonPromise = import('../data/vehicle-catalog-models.json').then((m) => m.default as JsonModel[]);
  }
  return modelsJsonPromise;
}

function envFlagOn(): boolean {
  try {
    return import.meta.env.VITE_VEHICLE_CATALOG_FALLBACK === '1';
  } catch {
    return false;
  }
}

function fallbackThreshold(): number {
  try {
    const v = import.meta.env.VITE_VEHICLE_CATALOG_FALLBACK_THRESHOLD;
    const n = v != null && v !== '' ? Number.parseInt(String(v), 10) : 50;
    return Number.isFinite(n) && n > 0 ? n : 50;
  } catch {
    return 50;
  }
}

export async function mergeCatalogBrandsWithFallback(remote: CatalogBrandRow[]): Promise<CatalogBrandRow[]> {
  const flag = envFlagOn();
  const threshold = fallbackThreshold();
  const needFallback = flag || remote.length < threshold;
  if (!needFallback) {
    return [...remote].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const names = await loadBrandNames();
  const byNorm = remoteBrandsByNormKey(remote);
  const extras: CatalogBrandRow[] = [];
  let i = 0;
  for (const name of names) {
    const key = normalizeCatalogName(name);
    if (byNorm.has(key)) continue;
    extras.push({
      id: makeLocalBrandId(name),
      name,
      sortOrder: 1_000_000 + i,
    });
    i += 1;
  }
  return [...remote, ...extras].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function listLocalCatalogModelsForBrand(brandId: string): Promise<CatalogModelRow[]> {
  const brandName = parseLocalBrandId(brandId);
  if (!brandName) return [];

  const rows = await loadAllModels();
  const seen = new Set<string>();
  const out: CatalogModelRow[] = [];
  for (const r of rows) {
    if (r.brand !== brandName) continue;
    const dedupe = `${r.name}|${r.year_from ?? ''}|${r.year_to ?? ''}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({
      id: makeLocalModelId({
        brandName,
        modelName: r.name,
        yearFrom: r.year_from ?? null,
        yearTo: r.year_to ?? null,
      }),
      brandId,
      name: r.name,
      yearFrom: r.year_from ?? null,
      yearTo: r.year_to ?? null,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
