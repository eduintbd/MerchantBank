import type { DemoOrder, DemoPosition, DemoTrade, TradingMistake } from '@/types/demo';

/**
 * Detect common trading mistakes from user's activity.
 */
export function detectMistakes(params: {
  orders: DemoOrder[];
  trades: DemoTrade[];
  positions: DemoPosition[];
  startingCash: number;
}): TradingMistake[] {
  const { orders, trades, positions, startingCash } = params;
  const mistakes: TradingMistake[] = [];
  const now = new Date().toISOString();

  // 1. Overtrading — more than 10 orders in a single day
  const ordersByDay = new Map<string, DemoOrder[]>();
  for (const o of orders) {
    const day = o.created_at.split('T')[0];
    ordersByDay.set(day, [...(ordersByDay.get(day) || []), o]);
  }
  for (const [day, dayOrders] of ordersByDay) {
    if (dayOrders.length > 10) {
      mistakes.push({
        id: `overtrading-${day}`,
        type: 'overtrading',
        title: 'Overtrading',
        description: `You placed ${dayOrders.length} orders on ${day}. High-frequency trading increases charges and often reduces returns.`,
        severity: 'warning',
        detected_at: now,
        lesson_title: 'Trading Discipline',
      });
    }
  }

  // 2. Concentration risk — single stock > 40% of portfolio
  const totalValue = positions.reduce((s, p) => s + Number(p.market_value), 0);
  if (totalValue > 0 && positions.length >= 2) {
    for (const pos of positions) {
      const pct = (Number(pos.market_value) / totalValue) * 100;
      if (pct > 40) {
        mistakes.push({
          id: `concentration-${pos.symbol}`,
          type: 'concentration',
          title: 'Portfolio Concentration',
          description: `${pos.symbol} represents ${pct.toFixed(1)}% of your portfolio. Consider diversifying across sectors to reduce risk.`,
          severity: 'warning',
          detected_at: now,
          lesson_title: 'Portfolio Diversification',
        });
      }
    }
  }

  // 3. Chasing losses — buying more of a losing position
  for (const pos of positions) {
    if (Number(pos.unrealized_pnl) < 0) {
      const buysAfterLoss = trades.filter(
        t => t.symbol === pos.symbol && t.side === 'BUY' && Number(t.price) > Number(pos.avg_cost)
      );
      if (buysAfterLoss.length >= 2) {
        mistakes.push({
          id: `chasing-${pos.symbol}`,
          type: 'chasing_loss',
          title: 'Chasing Losses',
          description: `You bought more ${pos.symbol} at higher prices while the position was losing. This is called "averaging up on a loser" and can amplify losses.`,
          severity: 'warning',
          detected_at: now,
          lesson_title: 'When to Cut Losses',
        });
      }
    }
  }

  // 4. Frequent cancellations
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  if (cancelledOrders.length > 5) {
    mistakes.push({
      id: 'frequent-cancel',
      type: 'frequent_cancel',
      title: 'Frequent Order Cancellations',
      description: `You've cancelled ${cancelledOrders.length} orders. This suggests indecision. Consider planning your trades before placing orders.`,
      severity: 'info',
      detected_at: now,
      lesson_title: 'Planning Your Trades',
    });
  }

  // 5. Poor risk discipline — total loss > 10% of starting capital
  const totalPnl = positions.reduce((s, p) => s + Number(p.unrealized_pnl) + Number(p.realized_pnl), 0);
  if (totalPnl < -(startingCash * 0.1)) {
    mistakes.push({
      id: 'poor-risk',
      type: 'poor_risk',
      title: 'Risk Management Alert',
      description: `Your total losses exceed 10% of your starting capital (৳${Math.abs(totalPnl).toFixed(2)}). Review your risk management strategy.`,
      severity: 'warning',
      detected_at: now,
      lesson_title: 'Risk Management Basics',
    });
  }

  return mistakes;
}
