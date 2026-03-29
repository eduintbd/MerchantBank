import { useState } from 'react';
import { useTransactions, useAddTransaction, useDeleteTransaction, useFinanceSummary } from '@/hooks/useFinanceTracker';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';

const CATEGORIES = {
  income: ['Salary', 'Dividends', 'Trading Profit', 'Freelance', 'Other Income'],
  expense: ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Investment', 'Education', 'Healthcare', 'Other'],
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

export function FinanceTrackerPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: transactions, isLoading } = useTransactions(month);
  const { data: summary } = useFinanceSummary(month);
  const addTransaction = useAddTransaction();
  const deleteTransaction = useDeleteTransaction();

  const handleAdd = () => {
    if (!category || !amount || !date) {
      toast.error('Please fill in all required fields');
      return;
    }
    addTransaction.mutate(
      { type: txType, category, amount: parseFloat(amount), description: description || undefined, date },
      {
        onSuccess: () => {
          toast.success('Transaction added');
          setCategory('');
          setAmount('');
          setDescription('');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to add'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success('Transaction deleted'),
    });
  };

  // Category breakdown for pie chart
  const categoryData = (transactions || []).reduce((acc: any[], tx: any) => {
    const existing = acc.find((item) => item.name === tx.category);
    if (existing) {
      existing.value += tx.amount;
    } else {
      acc.push({ name: tx.category, value: tx.amount });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Finance Tracker</h1>
          <p className="text-muted text-sm sm:text-base mt-1">Track your income and expenses</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 sm:gap-5 mb-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.total_income || 0)}
          icon={<TrendingUp size={20} />}
          iconColor="bg-success/15 text-success"
          gradient="grad-success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.total_expense || 0)}
          icon={<TrendingDown size={20} />}
          iconColor="bg-danger/15 text-danger"
          gradient="grad-danger"
        />
        <StatCard
          title="Net"
          value={formatCurrency(summary?.net || 0)}
          icon={<Wallet size={20} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add transaction form */}
        <Card className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Add Transaction</h2>

          {/* Type toggle */}
          <div className="flex gap-1 bg-black/5 rounded-xl p-1">
            <button
              onClick={() => { setTxType('income'); setCategory(''); }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                txType === 'income' ? 'bg-white text-success shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => { setTxType('expense'); setCategory(''); }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                txType === 'expense' ? 'bg-white text-danger shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              Expense
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select category</option>
              {CATEGORIES[txType].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <Button className="w-full" onClick={handleAdd} loading={addTransaction.isPending} icon={<Plus size={16} />}>
            Add Transaction
          </Button>
        </Card>

        {/* Chart + Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pie chart */}
          {categoryData.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Category Breakdown</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_: any, index: number) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Transactions table */}
          <Card padding={false}>
            <div className="px-5 sm:px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted text-xs border-b border-border">
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    <th className="px-3 py-3 text-left font-medium">Category</th>
                    <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Description</th>
                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted">Loading...</td>
                    </tr>
                  ) : (transactions || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted">No transactions this month</td>
                    </tr>
                  ) : (
                    (transactions || []).map((tx) => (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                        <td className="px-5 py-3 text-muted font-num">{formatDate(tx.date)}</td>
                        <td className="px-3 py-3">{tx.category}</td>
                        <td className="px-3 py-3 text-muted hidden sm:table-cell truncate max-w-[200px]">{tx.description || '-'}</td>
                        <td className={`px-3 py-3 text-right font-num font-medium ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => handleDelete(tx.id)} className="text-muted hover:text-danger transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>      </div>

    </div>
  );
}