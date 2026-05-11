/**
 * Colonnes GDS optionnelles : si les migrations COYA Drive GDS ne sont pas appliquées sur Supabase,
 * PostgREST renvoie 400 (colonne absente). On désactive alors le filtre / payload concerné pour rester compatible.
 */

export let driveItemsHasWorkspaceIdColumn = true;
export let driveItemsHasDocumentStatusColumn = true;
export let driveItemsHasCategoryColumn = true;

const warned = new Set<string>();

function errorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const e = error as { message?: string; details?: string; hint?: string };
  return [e.message, e.details, e.hint].filter(Boolean).join(' ');
}

/** PostgREST / Postgres : colonne inconnue ou absente du cache schéma. */
export function isMissingColumnError(error: unknown, column: string): boolean {
  const t = errorText(error).toLowerCase();
  const c = column.toLowerCase();
  const code = String((error as { code?: string })?.code || '');
  if (!t.includes(c)) return false;
  return (
    code === '42703' ||
    t.includes('does not exist') ||
    t.includes('schema cache') ||
    t.includes('could not find') ||
    t.includes('undefined column')
  );
}

export function absorbDriveItemsMissingColumnError(error: unknown, context: string): void {
  if (isMissingColumnError(error, 'workspace_id') && driveItemsHasWorkspaceIdColumn) {
    driveItemsHasWorkspaceIdColumn = false;
    const k = 'workspace_id';
    if (!warned.has(k)) {
      warned.add(k);
      console.warn(
        `[COYA Drive] Colonne workspace_id absente (${context}). Appliquez la migration GDS (drive_workspaces + drive_items). Mode sans espaces documentaires.`,
      );
    }
  }
  if (isMissingColumnError(error, 'document_status') && driveItemsHasDocumentStatusColumn) {
    driveItemsHasDocumentStatusColumn = false;
    const k = 'document_status';
    if (!warned.has(k)) {
      warned.add(k);
      console.warn(
        `[COYA Drive] Colonne document_status absente (${context}). Vues cycle de vie désactivées jusqu’à migration.`,
      );
    }
  }
  if (isMissingColumnError(error, 'category') && driveItemsHasCategoryColumn) {
    driveItemsHasCategoryColumn = false;
    const k = 'category';
    if (!warned.has(k)) {
      warned.add(k);
      console.warn(`[COYA Drive] Colonne category absente (${context}). Recherche simplifiée.`);
    }
  }
}

export function getDriveGdsSchemaFlags() {
  return {
    workspaceId: driveItemsHasWorkspaceIdColumn,
    documentStatus: driveItemsHasDocumentStatusColumn,
    category: driveItemsHasCategoryColumn,
  };
}

/** Retire du payload les clés dont on sait que la colonne manque encore côté DB. */
export function pruneDriveInsertRowForKnownSchema(row: Record<string, unknown>): void {
  if (!driveItemsHasWorkspaceIdColumn) delete row.workspace_id;
  if (!driveItemsHasDocumentStatusColumn) {
    delete row.document_status;
    delete row.confidentiality_level;
  }
  if (!driveItemsHasCategoryColumn) delete row.category;
}

/**
 * Retire du payload les colonnes que l’erreur PostgREST / Postgres indique comme absentes.
 */
export function stripDriveInsertRowFromError(row: Record<string, unknown>, error: unknown): boolean {
  let changed = false;
  const cols = [
    'workspace_id',
    'document_status',
    'confidentiality_level',
    'category',
    'tags',
    'linked_programme_id',
    'linked_project_id',
    'expires_at',
    'visibility',
    'owner_profile_id',
  ] as const;
  for (const col of cols) {
    if (row[col] === undefined) continue;
    if (isMissingColumnError(error, col)) {
      delete row[col];
      changed = true;
    }
  }
  return changed;
}
