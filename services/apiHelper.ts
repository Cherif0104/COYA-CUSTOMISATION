// Helper pour les appels API REST Supabase
import { supabase } from './supabaseService';
import { handleOptionalTableError, isTableUnavailable } from './optionalTableGuard';
import { verboseLogs } from './verboseLog';

const vlog = (...args: unknown[]) => {
  if (verboseLogs()) console.log(...args);
};

/** Erreur PostgREST typique : colonnes demandées absentes du schéma / mauvais select. */
export function isLikelyPostgrestSelectError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  const status = Number(e.status);
  const code = String(e.code ?? '');
  const blob = [e.message, e.details, e.hint].filter(Boolean).join(' ').toLowerCase();
  if (status === 400 && (code === 'PGRST204' || code === '42703')) return true;
  if (blob.includes('schema cache') && blob.includes('column')) return true;
  if (blob.includes('could not find') && blob.includes('column')) return true;
  if (/column\s+[\w.]+\s+does\s+not\s+exist/.test(blob)) return true;
  return false;
}

export class ApiHelper {
  private static baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tdwbqgyubigaurnjzbfv.supabase.co';
  private static apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkd2JxZ3l1YmlnYXVybmp6YmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODA2NzEsImV4cCI6MjA3NjU1NjY3MX0.bmGr3gY0GFeJelVIq8xwZJ6xaZhb-L-SAhn6ypg6zzU';

  // Headers communs pour tous les appels API avec authentification utilisateur
  private static async getHeaders() {
    // Récupérer le token de session de l'utilisateur connecté
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || this.apiKey;
    
    return {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // GET request
  static async get(endpoint: string, params?: Record<string, any>, customTimeout?: number) {
    try {
      if (isTableUnavailable(endpoint)) {
        return { data: [], error: null };
      }

      let url = `${this.baseUrl}/rest/v1/${endpoint}`;
      
      if (params) {
        const queryParts: string[] = [];
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Pour les filtres Supabase (format: column.operator.value), ne pas encoder les points
            if (key === 'filter' && typeof value === 'string' && value.includes('.')) {
              // Le filtre Supabase doit être ajouté directement sans encodage
              queryParts.push(`${key}=${value}`);
            } else {
              // Pour les autres paramètres, utiliser URLSearchParams
              queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`);
            }
          }
        });
        
        if (queryParts.length > 0) {
          url += `?${queryParts.join('&')}`;
        }
      }

      vlog(`🔍 API GET: ${url}`);
      
      const headers = await this.getHeaders();
      
      // Timeout plus long pour invoices (peut être lent à cause de la contrainte CHECK)
      const timeoutDuration = customTimeout || (endpoint === 'invoices' ? 30000 : 10000); // 30s pour invoices, 10s pour les autres
      
      // Créer un AbortController pour timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let parsedError: any = null;
        try {
          parsedError = await response.json();
        } catch {
          parsedError = { status: response.status, message: `HTTP error ${response.status}` };
        }
        parsedError.status = response.status;
        if (handleOptionalTableError(parsedError, endpoint, `ApiHelper.get(${endpoint})`)) {
          return { data: [], error: null };
        }
        const msg =
          typeof parsedError?.message === 'string' && parsedError.message.trim()
            ? parsedError.message
            : `HTTP error! status: ${response.status}`;
        const err = new Error(msg) as Error & {
          status?: number;
          code?: string;
          details?: string;
          hint?: string;
        };
        err.status = response.status;
        if (parsedError?.code != null) err.code = String(parsedError.code);
        if (parsedError?.details != null) err.details = String(parsedError.details);
        if (parsedError?.hint != null) err.hint = String(parsedError.hint);
        throw err;
      }
      
      const data = await response.json();
      console.log(`📊 API GET ${endpoint} - Résultat:`, data?.length || 0, 'éléments');
      return { data, error: null };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ Timeout API GET ${endpoint} - Réponse non reçue dans les 10 secondes`);
      } else {
        console.error(`❌ Erreur API GET ${endpoint}:`, error.message || error);
      }
      return { data: null, error };
    }
  }

  // POST request
  static async post(endpoint: string, payload: any) {
    try {
      const url = `${this.baseUrl}/rest/v1/${endpoint}`;
      
      vlog(`🔍 API POST: ${url}`);
      
      const headers = await this.getHeaders();
      
      // Créer un AbortController pour timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      
      const data = await response.json();
      vlog(`✅ API POST ${endpoint} - Créé:`, data[0]?.id);
      return { data: data[0], error: null };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ Timeout API POST ${endpoint}`);
      } else {
        console.error(`❌ Erreur API POST ${endpoint}:`, error.message || error);
      }
      return { data: null, error };
    }
  }

  // PUT request
  static async put(endpoint: string, id: string, payload: any) {
    try {
      const url = `${this.baseUrl}/rest/v1/${endpoint}?id=eq.${id}`;
      
      vlog(`🔍 API PUT: ${url}`);
      
      const headers = await this.getHeaders();
      
      // Créer un AbortController pour timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      
      const data = await response.json();
      console.log(`✅ API PUT ${endpoint} - Mis à jour:`, data[0]?.id);
      return { data: data[0], error: null };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ Timeout API PUT ${endpoint}`);
      } else {
        console.error(`❌ Erreur API PUT ${endpoint}:`, error.message || error);
      }
      return { data: null, error };
    }
  }

  // DELETE request
  static async delete(endpoint: string, id: string) {
    try {
      const url = `${this.baseUrl}/rest/v1/${endpoint}?id=eq.${id}`;
      
      vlog(`🔍 API DELETE: ${url}`);
      
      const headers = await this.getHeaders();
      
      // Créer un AbortController pour timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      
      vlog(`✅ API DELETE ${endpoint} - Supprimé:`, id);
      return { error: null };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ Timeout API DELETE ${endpoint}`);
      } else {
        console.error(`❌ Erreur API DELETE ${endpoint}:`, error.message || error);
      }
      return { error };
    }
  }
}
