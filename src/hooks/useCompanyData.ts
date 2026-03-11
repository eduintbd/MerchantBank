import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
      let query = supabase
        .from('company_financials')
        .select('*')
        .eq('symbol', symbol)
        .order('year', { ascending: false });

      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!symbol,
  });
}

export function useCompanyNews(symbol: string) {
  return useQuery({
    queryKey: ['company-news', symbol],
    queryFn: async (): Promise<CompanyNews[]> => {
      const { data, error } = await supabase
        .from('company_news')
        .select('*')
        .eq('symbol', symbol)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
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
