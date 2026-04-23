import { Link } from 'react-router-dom';
import { Gem, LineChart, BellRing, BookOpenCheck, Webhook, ArrowRight } from 'lucide-react';

export function EliteView() {
  return (
    <div className="rounded-2xl border border-[#a855f7]/30 bg-gradient-to-br from-[#a855f7]/10 via-[#a855f7]/5 to-transparent p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Gem size={18} className="text-[#a855f7]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#a855f7]">Elite · Coming soon</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Pro charts, alerts, and algorithmic trading</h2>
      <p className="text-sm text-muted max-w-xl">
        Full TradingView-style charting on top of live DSE/CSE data. Drawing tools, 100+ indicators,
        price alerts, strategy backtesting, and programmatic access via broker API.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        {[
          { icon: LineChart, title: 'Advanced charting', text: 'Candle / Heikin-Ashi / Renko, 15+ timeframes, 100+ indicators.' },
          { icon: BellRing, title: 'Price & signal alerts', text: 'SMS, push, and email alerts on price, volume, and signal changes.' },
          { icon: BookOpenCheck, title: 'Strategy backtesting', text: 'Test ideas against DSE historical data, walk-forward analysis.' },
          { icon: Webhook, title: 'Broker API & webhooks', text: 'Programmatic order placement, TradingView webhook bridge.' },
        ].map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-xl border border-[#a855f7]/15 bg-card-solid/60 backdrop-blur p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={15} className="text-[#a855f7]" />
                <h4 className="font-semibold text-sm">{f.title}</h4>
              </div>
              <p className="text-xs text-muted leading-relaxed">{f.text}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to="/billing"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-xl bg-[#a855f7] text-white hover:bg-[#9333ea] transition-colors"
        >
          Upgrade to Elite · ৳1,999/mo <ArrowRight size={14} />
        </Link>
        <span className="text-xs text-muted">Or preview from the selector above for 30 seconds.</span>
      </div>
    </div>
  );
}
