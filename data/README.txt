Catalogue véhicule (marques / modèles)
======================================

Fichiers :
- vehicle-catalog-brands.json : tableau JSON de noms de marques / divisions / labels commerciaux (triés).
- vehicle-catalog-models.json : tableau { brand, name, year_from, year_to } (year_to null = courant).

Volume actuel généré :
- 430 marques et labels globaux (USA, Chine, Corée, Belgique, France, Canada, Europe, Inde, Japon, bus/camions, historique).
- 22 404 modèles / variantes. Les grands constructeurs ont des modèles connus ; les petits acteurs utilisent une gamme représentative par segment + finitions, faute de catalogue constructeur officiel embarqué.

Import en base (après migration fleet phase 2, avec RLS insert réservée aux rôles manager/admin) :

Ordre recommandé :
  1. Appliquer les migrations Supabase jusqu'à 20260511170000_studio_crm_logistics_catalog.sql.
  2. Régénérer les JSON si besoin :
     node scripts/generate-vehicle-catalog-json.mjs
  3. Importer en base avec la clé service :

Option A — script Node (recommandé pour milliers de lignes) :
  cd repo
  set SUPABASE_URL=https://xxxx.supabase.co
  set SUPABASE_SERVICE_ROLE_KEY=eyJ...   (clé service : Dashboard → Settings → API)
  set VEHICLE_CATALOG_BATCH=250           (optionnel)
  node scripts/seed-vehicle-catalog.mjs

Le seed est batché et idempotent côté modèles : il charge les marques, lit les modèles existants, puis insère uniquement les lignes manquantes. Le service role contourne la RLS pour un chargement initial rapide. Ne pas exposer cette clé côté client.

Option B — SQL Editor Supabase : générer des INSERT par lots depuis CSV (COPY) en étant connecté avec un rôle qui bypass RLS ou désactiver temporairement RLS sur les tables catalogue (non recommandé en prod).

Regénérer vehicle-catalog-brands.json et vehicle-catalog-models.json :
  node scripts/generate-vehicle-catalog-json.mjs
