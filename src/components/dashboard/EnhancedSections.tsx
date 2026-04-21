import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useGlobalMarkets, useCommodities, useForexRates } from '@/hooks/useGlobalMarkets';
import { useMarketNews, type NewsItem } from '@/hooks/useMarketNews';
import { useSectorPerformance } from '@/hooks/useSectorPerformance';
import { dseSupabase } from '@/lib/supabase';
import { cn, formatVolume } from '@/lib/utils';
import type { LivePrice } from '@/types';
import {
  Globe, TrendingUp, TrendingDown, Newspaper, Cpu, Landmark,
  BarChart3, ArrowUpRight, ExternalLink, Fuel, Gem,
  DollarSign, ChevronRight, Layers, Flame, Sparkles,
  ChevronDown,
} from 'lucide-react';

const GREEN = '#00b386';
const RED = '#eb5b3c';
const TEXT_PRIMARY = '#121212';
const TEXT = '#44475b';
const MUTED = '#7c7e8c';
const MUTED_LIGHT = '#a1a3ad';
const BORDER = '#e9e9eb';
const SURFACE = '#f8f8f8';

/* ═══════════════════════════════════════════════════════════
   GLOBAL MARKETS OVERVIEW
   ═══════════════════════════════════════════════════════════ */
export function GlobalMarketsBar() {
  const { data: indices, isLoading } = useGlobalMarkets();

  if (isLoading) {
    return (
      <div className="border rounded-2xl p-4 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} style={{ color: GREEN }} />
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Global Markets</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!indices || indices.length === 0) return null;

  return (
    <div className="border rounded-2xl p-4 sm:p-5 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: GREEN }} />
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Global Markets</h3>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: MUTED_LIGHT }}>Live</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {indices.map(idx => {
          const up = idx.changePct >= 0;
          return (
            <div key={idx.symbol} className="rounded-xl p-3 transition-all hover:shadow-md"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{idx.region}</span>
                {up ? <TrendingUp size={12} style={{ color: GREEN }} /> : <TrendingDown size={12} style={{ color: RED }} />}
              </div>
              <div className="text-xs font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{idx.name}</div>
              <div className="text-sm font-bold font-num mt-0.5" style={{ color: TEXT_PRIMARY }}>
                {idx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] font-semibold font-num" style={{ color: up ? GREEN : RED }}>
                {up ? '+' : ''}{idx.changePct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMMODITIES + FOREX ROW
   ═══════════════════════════════════════════════════════════ */
export function CommoditiesAndForex() {
  const { data: commodities, isLoading: comLoading } = useCommodities();
  const { data: forex, isLoading: fxLoading } = useForexRates();
  const [activeTab, setActiveTab] = useState<'commodities' | 'forex'>('commodities');

  const isLoading = comLoading || fxLoading;

  if (isLoading) {
    return (
      <div className="border rounded-2xl p-4 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="border rounded-2xl overflow-hidden bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <button onClick={() => setActiveTab('commodities')}
          className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all',
            activeTab === 'commodities' ? 'bg-white' : 'border-transparent hover:bg-white/60'
          )}
          style={{ borderBottomColor: activeTab === 'commodities' ? GREEN : 'transparent', color: activeTab === 'commodities' ? GREEN : MUTED }}>
          <Gem size={13} /> Commodities
        </button>
        <button onClick={() => setActiveTab('forex')}
          className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all',
            activeTab === 'forex' ? 'bg-white' : 'border-transparent hover:bg-white/60'
          )}
          style={{ borderBottomColor: activeTab === 'forex' ? GREEN : 'transparent', color: activeTab === 'forex' ? GREEN : MUTED }}>
          <DollarSign size={13} /> Currency Exchange
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'commodities' && commodities && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {commodities.map(com => {
              const up = com.changePct >= 0;
              const iconMap: Record<string, any> = {
                'Gold': <Sparkles size={14} />,
                'Silver': <Gem size={14} />,
                'Crude Oil': <Fuel size={14} />,
                'Natural Gas': <Flame size={14} />,
                'Copper': <Layers size={14} />,
                'Platinum': <Gem size={14} />,
              };
              return (
                <div key={com.symbol} className="rounded-xl p-3 text-center transition-all hover:shadow-md"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center"
                    style={{ background: up ? 'rgba(0,179,134,0.08)' : 'rgba(235,91,60,0.08)', color: up ? GREEN : RED }}>
                    {iconMap[com.name] || <BarChart3 size={14} />}
                  </div>
                  <div className="text-[10px] font-medium truncate" style={{ color: MUTED }}>{com.name}</div>
                  <div className="text-sm font-bold font-num" style={{ color: TEXT_PRIMARY }}>
                    ${com.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-semibold font-num" style={{ color: up ? GREEN : RED }}>
                    {up ? '+' : ''}{com.changePct.toFixed(2)}%
                  </div>
                  <div className="text-[8px] mt-0.5" style={{ color: MUTED_LIGHT }}>{com.unit}</div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'forex' && forex && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {forex.map(fx => {
              const up = fx.changePct >= 0;
              return (
                <div key={fx.pair} className="rounded-xl p-3 transition-all hover:shadow-md"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{fx.flag}</span>
                    <span className="text-[10px] font-semibold uppercase" style={{ color: MUTED }}>{fx.pair}</span>
                  </div>
                  <div className="text-sm font-bold font-num" style={{ color: TEXT_PRIMARY }}>
                    ৳{fx.rate.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-semibold font-num" style={{ color: up ? GREEN : RED }}>
                    {up ? '+' : ''}{fx.changePct.toFixed(2)}%
                  </div>
                  <div className="text-[9px] mt-0.5 truncate" style={{ color: MUTED_LIGHT }}>{fx.name}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fallback if no data */}
        {activeTab === 'commodities' && (!commodities || commodities.length === 0) && (
          <div className="text-center py-8 text-xs" style={{ color: MUTED }}>Commodity data unavailable</div>
        )}
        {activeTab === 'forex' && (!forex || forex.length === 0) && (
          <div className="text-center py-8 text-xs" style={{ color: MUTED }}>Forex data unavailable</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MARKET NEWS FEED (multi-category)
   ═══════════════════════════════════════════════════════════ */
type NewsCategory = 'all' | 'global' | 'capital' | 'ai' | 'dse' | 'commodity';

const NEWS_TABS: { key: NewsCategory; label: string; icon: any }[] = [
  { key: 'all', label: 'All News', icon: Newspaper },
  { key: 'global', label: 'Global', icon: Globe },
  { key: 'dse', label: 'DSE', icon: BarChart3 },
  { key: 'ai', label: 'AI & Tech', icon: Cpu },
  { key: 'capital', label: 'Capital Market', icon: Landmark },
  { key: 'commodity', label: 'Commodities', icon: Gem },
];

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MarketNewsFeed() {
  const { data: news, isLoading } = useMarketNews();
  const [category, setCategory] = useState<NewsCategory>('all');

  const filtered = news?.filter(n => category === 'all' || n.category === category) || [];
  const displayed = filtered.slice(0, 12);

  return (
    <div className="border rounded-2xl overflow-hidden bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Category Tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-hide" style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        {NEWS_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setCategory(tab.key)}
              className={cn('flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs font-medium whitespace-nowrap border-b-2 transition-all',
                category === tab.key ? 'bg-white' : 'border-transparent hover:bg-white/60'
              )}
              style={{
                borderBottomColor: category === tab.key ? GREEN : 'transparent',
                color: category === tab.key ? GREEN : MUTED,
              }}>
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: MUTED }}>
            <Newspaper size={24} className="mx-auto mb-2 opacity-30" />
            No news available for this category
          </div>
        ) : (
          <div className="space-y-1">
            {displayed.map((item, i) => {
              const catColors: Record<string, string> = {
                global: '#5367ff',
                capital: '#6d28d9',
                ai: '#00b386',
                dse: '#f0b429',
                commodity: '#eb5b3c',
              };
              const catLabels: Record<string, string> = {
                global: 'Global',
                capital: 'Capital',
                ai: 'AI & Tech',
                dse: 'DSE',
                commodity: 'Commodity',
              };
              return (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-[#f8f8f8] group"
                  style={{ borderBottom: i < displayed.length - 1 ? `1px solid #f0f0f2` : 'none' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: catColors[item.category] || MUTED }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-[#00b386] transition-colors"
                      style={{ color: TEXT_PRIMARY }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: `${catColors[item.category] || MUTED}10`, color: catColors[item.category] || MUTED }}>
                        {catLabels[item.category] || item.category}
                      </span>
                      <span className="text-[10px]" style={{ color: MUTED_LIGHT }}>{item.source}</span>
                      {item.published && (
                        <span className="text-[10px]" style={{ color: MUTED_LIGHT }}>{timeAgo(item.published)}</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink size={12} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: MUTED_LIGHT }} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   UNIFIED MARKET HEATMAP (sector-grouped with stocks)
   ═══════════════════════════════════════════════════════════ */
interface SectorStock { symbol: string; sector: string; change_pct: number; volume: number; value_traded: number; }

function useStocksBySector() {
  return useQuery<Map<string, SectorStock[]>>({
    queryKey: ['stocksBySector'],
    enabled: !!dseSupabase,
    queryFn: async () => {
      if (!dseSupabase) return new Map();
      const [stocksRes, pricesRes] = await Promise.all([
        dseSupabase.from('stocks').select('symbol, sector').eq('is_active', true),
        dseSupabase.from('live_prices').select('symbol, change_pct, volume, value_traded'),
      ]);
      if (stocksRes.error || pricesRes.error) return new Map();
      const priceMap = new Map<string, any>();
      for (const p of pricesRes.data || []) priceMap.set(p.symbol, p);

      const sectorMap = new Map<string, SectorStock[]>();
      for (const s of stocksRes.data || []) {
        const p = priceMap.get(s.symbol);
        if (!p || !p.volume) continue;
        const sector = s.sector || 'Others';
        if (!sectorMap.has(sector)) sectorMap.set(sector, []);
        sectorMap.get(sector)!.push({
          symbol: s.symbol,
          sector,
          change_pct: p.change_pct || 0,
          volume: p.volume || 0,
          value_traded: p.value_traded || 0,
        });
      }
      // Sort stocks within each sector by value_traded desc
      for (const stocks of sectorMap.values()) {
        stocks.sort((a, b) => b.value_traded - a.value_traded);
      }
      return sectorMap;
    },
    refetchInterval: 60000,
  });
}

function getHeatColor(change: number): { bg: string; text: string } {
  if (change >= 3) return { bg: '#00b386', text: '#fff' };
  if (change >= 1.5) return { bg: 'rgba(0,179,134,0.7)', text: '#fff' };
  if (change >= 0.5) return { bg: 'rgba(0,179,134,0.35)', text: '#009973' };
  if (change >= 0) return { bg: 'rgba(0,179,134,0.12)', text: '#00b386' };
  if (change >= -0.5) return { bg: 'rgba(235,91,60,0.12)', text: '#eb5b3c' };
  if (change >= -1.5) return { bg: 'rgba(235,91,60,0.35)', text: '#c44425' };
  if (change >= -3) return { bg: 'rgba(235,91,60,0.7)', text: '#fff' };
  return { bg: '#eb5b3c', text: '#fff' };
}

function getSectorAvg(stocks: SectorStock[]): number {
  if (stocks.length === 0) return 0;
  return stocks.reduce((sum, s) => sum + s.change_pct, 0) / stocks.length;
}

export function UnifiedMarketHeatmap() {
  const { data: sectorMap, isLoading } = useStocksBySector();
  const { data: sectors } = useSectorPerformance();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Sort sectors by avg change descending
  const sortedSectors = useMemo(() => {
    if (!sectorMap) return [];
    return Array.from(sectorMap.entries())
      .map(([sector, stocks]) => ({ sector, stocks, avgChange: getSectorAvg(stocks), totalVolume: stocks.reduce((s, st) => s + st.volume, 0) }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [sectorMap]);

  if (isLoading || sortedSectors.length === 0) {
    return (
      <div className="border rounded-2xl p-4 sm:p-5 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Market Heatmap</h3>
        <div className="skeleton h-[240px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="border rounded-2xl p-4 sm:p-5 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={16} style={{ color: GREEN }} />
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Market Heatmap</h3>
        </div>
        <div className="flex items-center gap-3 text-[9px]" style={{ color: MUTED_LIGHT }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: RED }} /> Bearish</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: GREEN }} /> Bullish</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {sortedSectors.map(({ sector, stocks, avgChange, totalVolume }) => {
          const c = getHeatColor(avgChange);
          const isExpanded = expanded === sector;
          const topStocks = stocks.slice(0, 8); // show top 8 when expanded

          return (
            <div key={sector}>
              {/* Sector header row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : sector)}
                className="w-full flex items-center gap-2 rounded-xl p-2.5 sm:p-3 transition-all hover:opacity-90"
                style={{ background: c.bg, color: c.text }}>
                <ChevronDown size={14} className={cn('shrink-0 transition-transform', isExpanded && 'rotate-180')} style={{ opacity: 0.7 }} />
                <span className="text-[11px] sm:text-xs font-semibold truncate flex-1 text-left">{sector}</span>
                <span className="text-xs sm:text-sm font-bold font-num shrink-0">
                  {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </span>
                <span className="text-[9px] opacity-70 shrink-0 hidden sm:inline">{stocks.length} stocks</span>
                <span className="text-[9px] opacity-70 shrink-0 hidden sm:inline">Vol: {formatVolume(totalVolume)}</span>
              </button>

              {/* Expanded: show individual stocks */}
              {isExpanded && (
                <div className="flex flex-wrap gap-1 pt-1.5 pl-4">
                  {topStocks.map(stock => {
                    const sc = getHeatColor(stock.change_pct);
                    return (
                      <Link key={stock.symbol} to={`/stock/${stock.symbol}`}
                        className="rounded-lg px-2.5 py-1.5 text-center transition-all hover:scale-105"
                        style={{ background: sc.bg, color: sc.text, minWidth: 64 }}>
                        <span className="text-[10px] font-bold block">{stock.symbol}</span>
                        <span className="text-[9px] font-semibold font-num">
                          {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct.toFixed(1)}%
                        </span>
                      </Link>
                    );
                  })}
                  {stocks.length > 8 && (
                    <span className="text-[9px] self-center px-2" style={{ color: MUTED_LIGHT }}>
                      +{stocks.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DSE MARKET SUMMARY CARD (compact)
   ═══════════════════════════════════════════════════════════ */
export function DseMarketSummary({ stats }: {
  stats: { totalVolume: number; totalValue: number; totalTrades: number; advancers: number; decliners: number; unchanged: number; totalStocks: number };
}) {
  const total = stats.totalStocks;
  const advPct = total > 0 ? ((stats.advancers / total) * 100).toFixed(1) : '0';
  const decPct = total > 0 ? ((stats.decliners / total) * 100).toFixed(1) : '0';

  return (
    <div className="border rounded-2xl p-4 sm:p-5 bg-white" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} style={{ color: GREEN }} />
        <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>DSE Market Summary</h3>
      </div>

      {/* Breadth bar */}
      <div className="mb-4">
        <div className="flex h-3 rounded-full overflow-hidden">
          <div style={{ width: `${advPct}%`, background: GREEN }} />
          <div style={{ width: `${((stats.unchanged / total) * 100).toFixed(1)}%`, background: '#dddee1' }} />
          <div style={{ width: `${decPct}%`, background: RED }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-num">
          <span style={{ color: GREEN }}>{stats.advancers} Adv ({advPct}%)</span>
          <span style={{ color: MUTED_LIGHT }}>{stats.unchanged} Unch</span>
          <span style={{ color: RED }}>{stats.decliners} Dec ({decPct}%)</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-[10px] font-medium uppercase" style={{ color: MUTED_LIGHT }}>Volume</div>
          <div className="text-sm font-bold font-num" style={{ color: TEXT_PRIMARY }}>{formatVolume(stats.totalVolume)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-medium uppercase" style={{ color: MUTED_LIGHT }}>Value</div>
          <div className="text-sm font-bold font-num" style={{ color: TEXT_PRIMARY }}>৳{(stats.totalValue / 1e9).toFixed(2)}B</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-medium uppercase" style={{ color: MUTED_LIGHT }}>Trades</div>
          <div className="text-sm font-bold font-num" style={{ color: TEXT_PRIMARY }}>{formatVolume(stats.totalTrades)}</div>
        </div>
      </div>
    </div>
  );
}
