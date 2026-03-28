import { usePortfolio } from '@/hooks/useStocks';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ShieldCheck, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16'];

function getRiskLevel(sectorData: { name: string; value: number }[]): { level: string; color: string; description: string } {
  if (sectorData.length === 0) return { level: 'N/A', color: 'text-muted', description: 'Add stocks to your portfolio to see risk analysis' };

  const totalValue = sectorData.reduce((sum, s) => sum + s.value, 0);
  const maxConcentration = Math.max(...sectorData.map(s => (s.value / totalValue) * 100));

  if (maxConcentration > 60) return { level: 'High', color: 'text-danger', description: 'Your portfolio is heavily concentrated in one sector. Consider diversifying.' };
  if (maxConcentration > 40) return { level: 'Medium', color: 'text-warning', description: 'Your portfolio has moderate concentration. Some diversification recommended.' };
  return { level: 'Low', color: 'text-success', description: 'Your portfolio is well diversified across sectors.' };
}

export function PortfolioAnalysisPage() {
  const { data: portfolio, isLoading } = usePortfolio();

  // Build sector data from portfolio items
  const sectorMap = new Map<string, number>();
  for (const item of portfolio?.items || []) {
    // Use a generic sector label derived from stock symbols if no sector field
    const sector = (item as any).sector || 'Other';
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + item.current_value);
  }

  // If items don't have sector, group by stock symbol as sectors
  let sectorData: { name: string; value: number }[] = [];
  if (sectorMap.size <= 1 && (portfolio?.items || []).length > 1) {
    // Fall back to per-stock breakdown
    sectorData = (portfolio?.items || []).map(item => ({
      name: item.stock_symbol,
      value: item.current_value,
    }));
  } else {
    sectorData = Array.from(sectorMap.entries()).map(([name, value]) => ({ name, value }));
  }

  const risk = getRiskLevel(sectorData);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-center py-12 animate-fade-in">
        <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted mt-3">Loading portfolio data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Portfolio Analysis</h1>
        <p className="text-muted text-sm sm:text-base mt-1">Risk assessment and diversification insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <StatCard
          title="Total Value"
          value={formatCurrency(portfolio?.current_value || 0)}
          icon={<TrendingUp size={20} />}
          iconColor="bg-info/15 text-info"
          gradient="grad-info"
        />
        <StatCard
          title="Total P/L"
          value={formatCurrency(portfolio?.total_profit_loss || 0)}
          trend={portfolio ? { value: portfolio.total_profit_loss_percent } : undefined}
          gradient={portfolio && portfolio.total_profit_loss >= 0 ? 'grad-success' : 'grad-danger'}
        />
        <StatCard
          title="Stocks Held"
          value={portfolio?.total_stocks || 0}
          subtitle="unique stocks"
        />
        <StatCard
          title="Sectors"
          value={sectorData.length}
          subtitle="sector exposure"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Meter */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Risk Assessment</h2>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              risk.level === 'High' ? 'bg-danger/10' :
              risk.level === 'Medium' ? 'bg-warning/10' :
              risk.level === 'Low' ? 'bg-success/10' : 'bg-black/5'
            }`}>
              {risk.level === 'High' ? <AlertTriangle size={32} className="text-danger" /> :
               risk.level === 'Medium' ? <ShieldCheck size={32} className="text-warning" /> :
               risk.level === 'Low' ? <CheckCircle size={32} className="text-success" /> :
               <ShieldCheck size={32} className="text-muted" />}
            </div>
            <div>
              <p className={`text-2xl font-bold ${risk.color}`}>{risk.level} Risk</p>
              <p className="text-xs text-muted mt-1">{risk.description}</p>
            </div>
          </div>

          {/* Visual gauge */}
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            <div className={`flex-1 rounded-l-full ${risk.level === 'Low' || risk.level === 'Medium' || risk.level === 'High' ? 'bg-success' : 'bg-gray-200'}`} />
            <div className={`flex-1 ${risk.level === 'Medium' || risk.level === 'High' ? 'bg-warning' : 'bg-gray-200'}`} />
            <div className={`flex-1 rounded-r-full ${risk.level === 'High' ? 'bg-danger' : 'bg-gray-200'}`} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </Card>

        {/* Sector Pie Chart */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Sector Diversification</h2>
          {sectorData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">No portfolio data to display</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sectorData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {sectorData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Recommendations</h2>
        <div className="space-y-3">
          {(portfolio?.items || []).length === 0 && (
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-info" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Start Building Your Portfolio</p>
                <p className="text-xs text-muted mt-0.5">Begin by investing in well-known blue-chip stocks for stability.</p>
              </div>
            </Card>
          )}

          {risk.level === 'High' && (
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Diversify Your Holdings</p>
                <p className="text-xs text-muted mt-0.5">Your portfolio is too concentrated. Consider spreading investments across different sectors to reduce risk.</p>
              </div>
            </Card>
          )}

          {risk.level === 'Medium' && (
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Consider More Diversification</p>
                <p className="text-xs text-muted mt-0.5">Adding stocks from underrepresented sectors could improve your risk-adjusted returns.</p>
              </div>
            </Card>
          )}

          {risk.level === 'Low' && (portfolio?.items || []).length > 0 && (
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Well Diversified</p>
                <p className="text-xs text-muted mt-0.5">Your portfolio has good sector diversification. Continue monitoring and rebalancing periodically.</p>
              </div>
            </Card>
          )}
        </div>
      </div>      </div>

    </div>
  );
}