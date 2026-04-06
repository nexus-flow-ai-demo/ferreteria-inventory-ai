import { supabase } from '@/integrations/supabase/client';

// Re-export the centralized client
export { supabase };

export interface Invoice {
  id: string;
  tenant_id: string;
  issuer_name: string;
  issuer_tax_id: string | null;
  address: string | null;
  date: string;
  amount: number;
  concept: string | null;
  created_at: string;
}
