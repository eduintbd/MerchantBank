import { useQuery } from '@tanstack/react-query';
import { dseSupabase, supabase } from '@/lib/supabase';

interface CompanyFinancial {
  id: string;
  symbol: string;
  year: number;
  revenue?: number;
  net_income?: number;
  eps?: number;
  nav_per_share?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  total_assets?: number;
  total_liabilities?: number;
  operating_profit?: number;
}

interface CompanyNews {
  id: string;
  symbol: string;
  title: string;
  summary?: string;
  source?: string;
  url?: string;
  published_at: string;
  created_at: string;
}

interface CompanyManagement {
  id: string;
  symbol: string;
  name: string;
  designation: string;
  image_url?: string;
  bio?: string;
  order?: number;
}

export function useCompanyFinancials(symbol: string, year?: number) {
  return useQuery({
    queryKey: ['company-financials', symbol, year],
    queryFn: async (): Promise<CompanyFinancial[]> => {
      const client = dseSupabase || supabase;

      // Query financial_statements from DSE data source
      let query = client
        .from('financial_statements')
        .select('*')
        .eq('symbol', symbol)
        .order('period_end', { ascending: false });

      if (year) {
        query = query.gte('period_end', `${year}-01-01`).lte('period_end', `${year}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id?.toString() || s.symbol + s.period_end,
        symbol: s.symbol,
        year: new Date(s.period_end).getFullYear(),
        revenue: s.revenue ?? undefined,
        net_income: s.net_profit ?? undefined,
        eps: s.eps ?? undefined,
        nav_per_share: s.nav_per_share ?? undefined,
        pe_ratio: undefined,
        dividend_yield: undefined,
        total_assets: undefined,
        total_liabilities: undefined,
        operating_profit: undefined,
      }));
    },
    enabled: !!symbol,
  });
}

export function useCompanyFundamentals(symbol: string) {
  return useQuery({
    queryKey: ['company-fundamentals', symbol],
    queryFn: async () => {
      const client = dseSupabase || supabase;

      const { data, error } = await client
        .from('fundamentals')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!symbol,
  });
}

export function useCompanyNews(symbol: string) {
  return useQuery({
    queryKey: ['company-news', symbol],
    queryFn: async (): Promise<CompanyNews[]> => {
      // News not available in UCB CSM yet — return empty
      return [];
    },
    enabled: !!symbol,
  });
}

export function useCompanyManagement(symbol: string) {
  return useQuery({
    queryKey: ['company-management', symbol],
    queryFn: async (): Promise<CompanyManagement[]> => {
      const { data, error } = await supabase
        .from('company_management')
        .select('*')
        .eq('symbol', symbol)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!symbol,
  });
}
