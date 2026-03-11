import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

interface FinanceSummary {
  total_income: number;
  total_expense: number;
  net: number;
}

export function useTransactions(month?: string) {
  return useQuery({
    queryKey: ['transactions', month],
    queryFn: async (): Promise<Transaction[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('income_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (month) {
        // month format: "YYYY-MM"
        const startDate = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const endDate = new Date(y, m, 0).toISOString().split('T')[0]; // last day of month
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: {
      type: 'income' | 'expense';
      category: string;
      amount: number;
      description?: string;
      date: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('income_expenses')
        .insert({
          user_id: user.id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description || null,
          date: transaction.date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}

export function useFinanceSummary(month?: string) {
  return useQuery({
    queryKey: ['finance-summary', month],
    queryFn: async (): Promise<FinanceSummary> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('income_expenses')
        .select('type, amount')
        .eq('user_id', user.id);

      if (month) {
        const startDate = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const endDate = new Date(y, m, 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalIncome = (data || [])
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const totalExpense = (data || [])
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      return {
        total_income: totalIncome,
        total_expense: totalExpense,
        net: totalIncome - totalExpense,
      };
    },
  });
}
