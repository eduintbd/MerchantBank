import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStock } from '@/hooks/useStocks';
import { useCompanyFinancials, useCompanyNews, useCompanyManagement } from '@/hooks/useCompanyData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber, formatDate, getChangeColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3, Newspaper, Users, Activity } from 'lucide-react';

type TabType = 'overview' | 'financials' | 'news' | 'management';

export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { data: stock, isLoading: stockLoading } = useStock(symbol || '');
  const { data: financials } = useCompanyFinancials(symbol || '');
  const { data: news } = useCompanyNews(symbol || '');
  const { data: management } = useCompanyManagement(symbol || '');

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'financials', label: 'Financials', icon: BarChart3 },
    { key: 'news', label: 'News', icon: Newspaper },
    { key: 'management', label: 'Management', icon: Users },
  ];

  if (stockLoading) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted mt-3">Loading stock data...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <Activity size={40} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">Stock not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">{stock.symbol}</h1>
          <Badge status={stock.change >= 0 ? 'active' : 'rejected'} label={stock.sector} />
        </div>
        <p className="text-muted text-sm sm:text-base">{stock.company_name}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-2xl sm:text-3xl font-bold font-num">{formatCurrency(stock.last_price)}</span>
          <span className={`flex items-center gap-1 text-sm font-semibold font-num ${getChangeColor(stock.change)}`}>
            {stock.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/5 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Open', value: formatCurrency(stock.open) },
            { label: 'High', value: formatCurrency(stock.high) },
            { label: 'Low', value: formatCurrency(stock.low) },
            { label: 'Prev Close', value: formatCurrency(stock.close) },
            { label: 'Volume', value: formatNumber(stock.volume) },
            { label: 'Sector', value: stock.sector || 'N/A' },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-xs text-muted uppercase tracking-wider">{item.label}</p>
              <p className="text-base sm:text-lg font-semibold font-num mt-1">{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'financials' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs border-b border-border">
                  <th className="px-5 py-3 text-left font-medium">Year</th>
                  <th className="px-3 py-3 text-right font-medium">Revenue</th>
                  <th className="px-3 py-3 text-right font-medium">Net Income</th>
                  <th className="px-3 py-3 text-right font-medium">EPS</th>
                  <th className="px-3 py-3 text-right font-medium">NAV</th>
                  <th className="px-3 py-3 text-right font-medium">P/E</th>
                  <th className="px-5 py-3 text-right font-medium">Div Yield</th>
                </tr>
              </thead>
              <tbody>
                {(financials || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted">No financial data available</td>
                  </tr>
                ) : (
                  (financials || []).map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3 font-medium">{f.year}</td>
                      <td className="px-3 py-3 text-right font-num">{f.revenue ? formatNumber(f.revenue) : '-'}</td>
                      <td className="px-3 py-3 text-right font-num">{f.net_income ? formatNumber(f.net_income) : '-'}</td>
                      <td className="px-3 py-3 text-right font-num">{f.eps?.toFixed(2) ?? '-'}</td>
                      <td className="px-3 py-3 text-right font-num">{f.nav_per_share?.toFixed(2) ?? '-'}</td>
                      <td className="px-3 py-3 text-right font-num">{f.pe_ratio?.toFixed(2) ?? '-'}</td>
                      <td className="px-5 py-3 text-right font-num">{f.dividend_yield ? `${f.dividend_yield.toFixed(2)}%` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'news' && (
        <div className="space-y-3">
          {(news || []).length === 0 ? (
            <Card className="text-center py-8">
              <Newspaper size={36} className="text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">No news available</p>
            </Card>
          ) : (
            (news || []).map((item) => (
              <Card key={item.id} hover className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
                  <span className="text-xs text-muted whitespace-nowrap">{formatDate(item.published_at)}</span>
                </div>
                {item.summary && (
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{item.summary}</p>
                )}
                {item.source && (
                  <p className="text-xs text-info">{item.source}</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'management' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(management || []).length === 0 ? (
            <Card className="text-center py-8 col-span-full">
              <Users size={36} className="text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">No management data available</p>
            </Card>
          ) : (
            (management || []).map((person) => (
              <Card key={person.id} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {person.image_url ? (
                    <img src={person.image_url} alt={person.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{person.name}</h3>
                <p className="text-xs text-muted mt-0.5">{person.designation}</p>
                {person.bio && (
                  <p className="text-xs text-muted mt-2 line-clamp-3">{person.bio}</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
