import { supabase } from '../supabaseService';

export type WorkforceSupabaseUserContext = {
  userId: string;
  organizationId: string;
};

/** Résout l’utilisateur auth et l’organisation courante (profil). */
export async function getCurrentUserOrgContext(): Promise<WorkforceSupabaseUserContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !profile?.organization_id) return null;

  return {
    userId: user.id,
    organizationId: profile.organization_id as string,
  };
}
