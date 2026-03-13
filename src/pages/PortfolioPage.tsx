import { useState } from 'react';
import { usePortfolio } from '@/hooks/useStocks';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { Briefcase, TrendingUp, TrendingDown, BarChart3, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PortfolioUploadModal } from '@/components/portfolio/PortfolioUploadModal';

const COLORS = ['#4fa3e0', '#00d09c', '#ffa502', '#ff4757', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export function PortfolioPage() {
  const { data: portfolio, isLoading } = usePortfolio();
  const [uploadOpen, setUploadOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  const pieData = portfolio?.items.map(item => ({ name: item.stock_symbol, value: item.current_value })) || [];
  const barData = portfolio?.items.map(item => ({ name: item.stock_symbol, profit: item.profit_loss, percent: item.profit_loss_percent })) || [];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted text-sm sm:text-base mt-1">Track your investment performance</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} variant="secondary" icon={<Upload size={16} />}>
          Import Portfolio
        </Button>
      </div>

      <PortfolioUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        <StatCard
          title="Current Value"
          value={formatCurrency(portfolio?.current_value || 0)}
          icon={<Briefcase size={20} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
        />
        <StatCard
          title="Total Invested"
          value={formatCurrency(portfolio?.total_invested || 0)}
          icon={<BarChart3 size={20} />}
          iconColor="bg-warning/15 text-warning"
          gradient="grad-warning"
        />
        <StatCard
          title="Total P/L"
          value={formatCurrency(portfolio?.total_profit_loss || 0)}
          icon={portfolio && portfolio.total_profit_loss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          iconColor={portfolio && portfolio.total_profit_loss >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}
          gradient={portfolio && portfolio.total_profit_loss >= 0 ? 'grad-success' : 'grad-danger'}
          trend={portfolio ? { value: portfolio.total_profit_loss_percent, label: 'overall' } : undefined}
        />
        <StatCard
          title="Holdings"
          value={portfolio?.total_stocks || 0}
          subtitle="Active stocks"
          icon={<BarChart3 size={20} />}
          iconColor="bg-success/15 text-success"
          gradient="grad-primary"
        />
      </div>

      {/* Charts */}
      {portfolio && portfolio.items.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <Card>
              <h3 className="font-semibold text-base mb-5">Portfolio Allocation</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    stroke="none"
                    fontSize={12}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, color: '#1a1a2e', fontSize: 13, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="font-semibold text-base mb-5">Profit/Loss by Stock</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} />
                  <YAxis fontSize={12} tick={{ fill: '#6b7280' }} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, color: '#1a1a2e', fontSize: 13, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.profit >= 0 ? '#00d09c' : '#ff4757'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="mt-6 sm:mt-8">
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-base">Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="px-5 sm:px-6 py-3.5 font-medium">Stock</th>
                  <th className="px-3 py-3.5 font-medium text-right">Qty</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden sm:table-cell">Avg Buy</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden sm:table-cell">Current</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Invested</th>
                  <th className="px-3 py-3.5 font-medium text-right hidden md:table-cell">Value</th>
                  <th className="px-3 py-3.5 font-medium text-right">P/L</th>
                  <th className="px-5 sm:px-6 py-3.5 font-medium text-right">P/L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio?.items.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-muted">No holdings yet. Start trading to build your portfolio.</td></tr>
                ) : (
                  portfolio?.items.map(item => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-5 sm:px-6 py-4">
                        <div className="font-medium text-foreground">{item.stock_symbol}</div>
                        <div className="text-xs text-muted hidden sm:block">{item.company_name}</div>
                      </td>
                      <td className="px-3 py-4 text-right font-num">{item.quantity}</td>
                      <td className="px-3 py-4 text-right font-num hidden sm:table-cell">{formatCurrency(item.avg_buy_price)}</td>
                      <td className="px-3 py-4 text-right font-num hidden sm:table-cell">{formatCurrency(item.current_price)}</td>
                      <td className="px-3 py-4 text-right font-num hidden md:table-cell">{formatCurrency(item.total_invested)}</td>
                      <td className="px-3 py-4 text-right font-num font-medium hidden md:table-cell">{formatCurrency(item.current_value)}</td>
                      <td className={`px-3 py-4 text-right font-num font-medium ${getChangeColor(item.profit_loss)}`}>
                        {formatCurrency(item.profit_loss)}
                      </td>
                      <td className={`px-5 sm:px-6 py-4 text-right font-num font-medium ${getChangeColor(item.profit_loss_percent)}`}>
                        {formatPercent(item.profit_loss_percent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>      </div>

    </div>
  );
}