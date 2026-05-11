/**
 * Import batché des marques et modèles catalogue (vehicle_catalog_brands / vehicle_catalog_models).
 * Nécessite SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (Dashboard Supabase → API).
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const BATCH = Number.parseInt(process.env.VEHICLE_CATALOG_BATCH || '250', 10);

async function loadJson(rel) {
  const p = path.join(root, rel);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const brandNames = await loadJson('data/vehicle-catalog-brands.json');
  const modelRows = await loadJson('data/vehicle-catalog-models.json');

  console.log('Brands file:', brandNames.length, '| Models file:', modelRows.length);

  for (let i = 0; i < brandNames.length; i += BATCH) {
    const slice = brandNames.slice(i, i + BATCH).map((name, j) => ({
      name,
      sort_order: i + j,
    }));
    const { error } = await supabase.from('vehicle_catalog_brands').upsert(slice, {
      onConflict: 'name',
      ignoreDuplicates: false,
    });
    if (error) {
      console.error('Brand batch error', i, error.message);
      process.exit(1);
    }
    console.log('Brands upserted', Math.min(i + BATCH, brandNames.length), '/', brandNames.length);
  }

  const { data: allBrands, error: bErr } = await supabase.from('vehicle_catalog_brands').select('id,name');
  if (bErr || !allBrands) {
    console.error('Cannot load brand ids', bErr?.message);
    process.exit(1);
  }
  const brandId = new Map(allBrands.map((r) => [r.name, r.id]));

  const { data: existingRows, error: existingErr } = await supabase
    .from('vehicle_catalog_models')
    .select('brand_id,name,year_from,year_to');
  if (existingErr) {
    console.error('Cannot load existing models', existingErr.message);
    process.exit(1);
  }

  const existing = new Set(
    (existingRows || []).map((r) => `${r.brand_id}|${r.name}|${r.year_from ?? ''}|${r.year_to ?? ''}`),
  );
  const inserts = [];
  for (const row of modelRows) {
    const bid = brandId.get(row.brand);
    if (!bid) {
      console.warn('Skip model (unknown brand):', row.brand, row.name);
      continue;
    }
    const keyParts = [bid, row.name, row.year_from ?? '', row.year_to ?? ''];
    const modelKey = keyParts.join('|');
    if (existing.has(modelKey)) continue;
    existing.add(modelKey);
    inserts.push({
      brand_id: bid,
      name: row.name,
      year_from: row.year_from ?? null,
      year_to: row.year_to ?? null,
    });
  }

  for (let i = 0; i < inserts.length; i += BATCH) {
    const slice = inserts.slice(i, i + BATCH);
    const { error } = await supabase.from('vehicle_catalog_models').insert(slice);
    if (error) {
      console.error('Model batch error', i, error.message);
      process.exit(1);
    }
    console.log('Models inserted', Math.min(i + BATCH, inserts.length), '/', inserts.length);
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
