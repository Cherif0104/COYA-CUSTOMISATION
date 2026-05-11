import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Configuration Supabase
// IMPORTANT : ne jamais embarquer de clés par défaut dans le code (risque fuite / mauvais environnement).
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey);

// Si non configuré, on injecte des valeurs placeholder VALIDE (pour éviter crash runtime),
// tout en gardant `isSupabaseConfigured=false` pour bloquer l’app sur l’écran de configuration.
const supabaseUrl = isSupabaseConfigured ? envSupabaseUrl : 'http://localhost';
const supabaseAnonKey = isSupabaseConfigured ? envSupabaseAnonKey : 'public-anon-key';

// IMPORTANT :
// - Ne pas throw ici : sinon l'app peut afficher une page blanche dès l'import.
// - On expose un client "placeholder" pour garder l'UI vivante, et l'app doit afficher un écran de configuration
//   tant que `isSupabaseConfigured === false`.
if (!isSupabaseConfigured) {
  console.error(
    'Supabase URL or Anon Key is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env (.env.local / .env).'
  );
}

// Créer le client Supabase avec persistance de session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Client sans persistance : inscriptions / appels auth isolés sans remplacer la session de l’admin connecté.
 * Une seule instance + `storageKey` distincte évite l’avertissement « Multiple GoTrueClient instances »
 * (même clé localStorage que le client principal).
 */
let ephemeralClient: SupabaseClient | null = null;

export function createEphemeralSupabaseClient(): SupabaseClient {
  if (!ephemeralClient) {
    ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-coya-pro-ephemeral-auth',
      },
    });
  }
  return ephemeralClient;
}

// Test de connexion
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connexion Supabase réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Supabase:', error);
    return false;
  }
};

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          full_name: string;
          phone_number: string | null;
          avatar_url: string | null;
          role: string;
          skills: string[] | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          is_active: boolean | null;
          last_login: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          full_name: string;
          phone_number?: string | null;
          avatar_url?: string | null;
          role?: string;
          skills?: string[] | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          is_active?: boolean | null;
          last_login?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          full_name?: string;
          phone_number?: string | null;
          avatar_url?: string | null;
          role?: string;
          skills?: string[] | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          is_active?: boolean | null;
          last_login?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string | null;
          priority: string | null;
          start_date: string | null;
          end_date: string | null;
          progress: number | null;
          budget: number | null;
          owner_id: string | null;
          team_members: string[] | null;
          created_at: string | null;
          updated_at: string | null;
          tasks: any | null;
          risks: any | null;
          client: string | null;
          tags: string[] | null;
          local_user_id: number | null;
          team_members_local: number[] | null;
          id_numeric: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number | null;
          budget?: number | null;
          owner_id?: string | null;
          team_members?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          tasks?: any | null;
          risks?: any | null;
          client?: string | null;
          tags?: string[] | null;
          local_user_id?: number | null;
          team_members_local?: number[] | null;
          id_numeric?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number | null;
          budget?: number | null;
          owner_id?: string | null;
          team_members?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          tasks?: any | null;
          risks?: any | null;
          client?: string | null;
          tags?: string[] | null;
          local_user_id?: number | null;
          team_members_local?: number[] | null;
          id_numeric?: number | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          number: string;
          client_name: string;
          amount: number;
          status: string | null;
          due_date: string | null;
          issue_date: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          user_id: string | null;
          description: string | null;
          items: any | null;
          tax: number | null;
          total: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          number: string;
          client_name: string;
          amount: number;
          status?: string | null;
          due_date?: string | null;
          issue_date?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          description?: string | null;
          items?: any | null;
          tax?: number | null;
          total?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          number?: string;
          client_name?: string;
          amount?: number;
          status?: string | null;
          due_date?: string | null;
          issue_date?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          description?: string | null;
          items?: any | null;
          tax?: number | null;
          total?: number | null;
          notes?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          title: string;
          amount: number;
          category: string | null;
          date: string;
          receipt_url: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          user_id: string | null;
          description: string | null;
          status: string | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          title: string;
          amount: number;
          category?: string | null;
          date: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          description?: string | null;
          status?: string | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          title?: string;
          amount?: number;
          category?: string | null;
          date?: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          description?: string | null;
          status?: string | null;
          tags?: string[] | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          position: string | null;
          status: string | null;
          source: string | null;
          notes: string | null;
          tags: string[] | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          status?: string | null;
          source?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          status?: string | null;
          source?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      time_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          task_id: string | null;
          description: string | null;
          hours: number;
          date: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          task_id?: string | null;
          description?: string | null;
          hours: number;
          date: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          task_id?: string | null;
          description?: string | null;
          hours?: number;
          date?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          status: string;
          reason: string | null;
          approver_id: string | null;
          rejection_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          status?: string;
          reason?: string | null;
          approver_id?: string | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          leave_type_id?: string;
          start_date?: string;
          end_date?: string;
          status?: string;
          reason?: string | null;
          approver_id?: string | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          instructor: string;
          duration: number;
          level: string;
          category: string;
          price: number | null;
          status: string | null;
          thumbnail_url: string | null;
          rating: number | null;
          students_count: number | null;
          lessons_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          instructor: string;
          duration: number;
          level: string;
          category: string;
          price?: number | null;
          status?: string | null;
          thumbnail_url?: string | null;
          rating?: number | null;
          students_count?: number | null;
          lessons_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          instructor?: string;
          duration?: number;
          level?: string;
          category?: string;
          price?: number | null;
          status?: string | null;
          thumbnail_url?: string | null;
          rating?: number | null;
          students_count?: number | null;
          lessons_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      objectives: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          quarter: string;
          year: number;
          owner_id: string;
          status: string | null;
          progress: number | null;
          created_at: string | null;
          updated_at: string | null;
          priority: string | null;
          start_date: string | null;
          end_date: string | null;
          category: string | null;
          owner_name: string | null;
          team_members: any | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          quarter: string;
          year: number;
          owner_id: string;
          status?: string | null;
          progress?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          priority?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          category?: string | null;
          owner_name?: string | null;
          team_members?: any | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          quarter?: string;
          year?: number;
          owner_id?: string;
          status?: string | null;
          progress?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          priority?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          category?: string | null;
          owner_name?: string | null;
          team_members?: any | null;
        };
      };
      knowledge_articles: {
        Row: {
          id: string;
          title: string;
          content: string;
          summary: string | null;
          category: string;
          type: string | null;
          status: string | null;
          tags: string[] | null;
          author: string;
          views: number | null;
          rating: number | null;
          created_at: string | null;
          updated_at: string | null;
          user_id: string | null;
          helpful: number | null;
          last_viewed: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          summary?: string | null;
          category: string;
          type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          author: string;
          views?: number | null;
          rating?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          helpful?: number | null;
          last_viewed?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          summary?: string | null;
          category?: string;
          type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          author?: string;
          views?: number | null;
          rating?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          helpful?: number | null;
          last_viewed?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          type: string;
          entity_id: string | null;
          read: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          type: string;
          entity_id?: string | null;
          read?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          type?: string;
          entity_id?: string | null;
          read?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}

export default supabase;
