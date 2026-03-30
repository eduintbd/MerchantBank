import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, dseSupabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoContext';
import { validateOrder, simulateFill } from '@/services/orderSimulator';
import { calculateCharges } from '@/services/feeCalculator';
import type {
  DemoOrder,
  DemoOrderSide,
  DemoOrderType,
  DemoTrade,
  DemoPosition,
  FeeRule,
} from '@/types/demo';

// ── Query: Fetch all demo orders for current account ──

export function useDemoOrders() {
  const { demoAccount } = useDemo();

  return useQuery({
    queryKey: ['demo-orders', demoAccount?.id],
    queryFn: async (): Promise<DemoOrder[]> => {
      if (!demoAccount) return [];

      const { data, error } = await supabase
        .from('demo_orders')
        .select('*')
        .eq('demo_account_id', demoAccount.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DemoOrder[];
    },
    enabled: !!demoAccount,
  });
}

// ── Mutation: Place a new demo order ──

interface PlaceOrderParams {
  symbol: string;
  side: DemoOrderSide;
  orderType: DemoOrderType;
  quantity: number;
  limitPrice: number | null;
}

export function usePlaceDemoOrder() {
  const { demoAccount, refreshAccount } = useDemo();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PlaceOrderParams) => {
      if (!demoAccount) throw new Error('No demo account');

      // 1. Fetch live price from DSE
      const { data: livePrice } = await dseSupabase
        .from('live_prices')
        .select('*')
        .eq('symbol', params.symbol)
        .single();

      const lastPrice = livePrice?.ltp || 0;
      const highPrice = livePrice?.high || lastPrice;
      const lowPrice = livePrice?.low || lastPrice;

      // 2. Get current position for sell validation
      const { data: existingPosition } = await supabase
        .from('demo_positions')
        .select('quantity')
        .eq('demo_account_id', demoAccount.id)
        .eq('symbol', params.symbol)
        .maybeSingle();

      const currentPosition = existingPosition?.quantity || 0;

      // 3. Validate the order
      const validation = validateOrder({
        side: params.side,
        orderType: params.orderType,
        quantity: params.quantity,
        limitPrice: params.limitPrice,
        lastPrice,
        account: demoAccount,
        currentPosition,
      });

      if (!validation.valid) {
        throw new Error(validation.reason || 'Order validation failed');
      }

      // 4. Insert the order with status 'submitted'
      const { data: order, error: orderError } = await supabase
        .from('demo_orders')
        .insert({
          demo_account_id: demoAccount.id,
          symbol: params.symbol,
          side: params.side,
          order_type: params.orderType,
          quantity: params.quantity,
          limit_price: params.limitPrice,
          filled_quantity: 0,
          avg_fill_price: 0,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 5. Simulate fill
      const fillResult = simulateFill({
        side: params.side,
        orderType: params.orderType,
        quantity: params.quantity,
        limitPrice: params.limitPrice,
        lastPrice,
        highPrice,
        lowPrice,
      });

      if (!fillResult.canFill) {
        // Order stays queued — not filled yet
        await supabase
          .from('demo_orders')
          .update({ status: 'queued' })
          .eq('id', order.id);
        return { order: { ...order, status: 'queued' as const }, filled: false };
      }

      // 6. Update order as filled
      const grossAmount = fillResult.fillPrice * fillResult.fillQuantity;
      await supabase
        .from('demo_orders')
        .update({
          status: 'filled',
          filled_quantity: fillResult.fillQuantity,
          avg_fill_price: fillResult.fillPrice,
          executed_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // 7. Fetch fee rules
      const { data: feeRules } = await supabase
        .from('fee_rules')
        .select('*')
        .eq('is_active', true);

      const rules: FeeRule[] = (feeRules && feeRules.length > 0) ? feeRules as FeeRule[] : [];

      // 8. Calculate charges
      const charges = calculateCharges(grossAmount, params.side, rules.length > 0 ? rules : await getDefaultRules());

      // 9. Create demo trade
      const netAmount = params.side === 'BUY'
        ? grossAmount + charges.totalCharges
        : grossAmount - charges.totalCharges;

      const { data: trade, error: tradeError } = await supabase
        .from('demo_trades')
        .insert({
          demo_order_id: order.id,
          demo_account_id: demoAccount.id,
          symbol: params.symbol,
          side: params.side,
          quantity: fillResult.fillQuantity,
          price: fillResult.fillPrice,
          gross_amount: grossAmount,
          total_charges: charges.totalCharges,
          net_amount: netAmount,
          trade_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // 10. Insert fee charges
      if (charges.fees.length > 0) {
        const feeInserts = charges.fees.map(f => ({
          demo_trade_id: trade.id,
          fee_rule_id: f.rule.id,
          fee_name: f.rule.name,
          amount: f.amount,
        }));
        await supabase.from('fee_charges').insert(feeInserts);
      }

      // 11. Upsert demo position with avg cost calculation
      if (params.side === 'BUY') {
        const { data: pos } = await supabase
          .from('demo_positions')
          .select('*')
          .eq('demo_account_id', demoAccount.id)
          .eq('symbol', params.symbol)
          .maybeSingle();

        if (pos) {
          // Weighted average cost
          const existingQty = Number(pos.quantity);
          const existingCost = Number(pos.avg_cost);
          const newTotalQty = existingQty + fillResult.fillQuantity;
          const newAvgCost = ((existingCost * existingQty) + (fillResult.fillPrice * fillResult.fillQuantity)) / newTotalQty;
          const newMarketValue = newTotalQty * lastPrice;
          const newUnrealizedPnl = (lastPrice - newAvgCost) * newTotalQty;

          await supabase
            .from('demo_positions')
            .update({
              quantity: newTotalQty,
              avg_cost: Math.round(newAvgCost * 100) / 100,
              market_price: lastPrice,
              market_value: Math.round(newMarketValue * 100) / 100,
              unrealized_pnl: Math.round(newUnrealizedPnl * 100) / 100,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pos.id);
        } else {
          // New position
          const marketValue = fillResult.fillQuantity * lastPrice;
          const unrealizedPnl = (lastPrice - fillResult.fillPrice) * fillResult.fillQuantity;

          await supabase
            .from('demo_positions')
            .insert({
              demo_account_id: demoAccount.id,
              symbol: params.symbol,
              quantity: fillResult.fillQuantity,
              avg_cost: fillResult.fillPrice,
              market_price: lastPrice,
              market_value: Math.round(marketValue * 100) / 100,
              unrealized_pnl: Math.round(unrealizedPnl * 100) / 100,
              realized_pnl: 0,
            });
        }
      } else {
        // SELL — reduce position, realize P&L
        const { data: pos } = await supabase
          .from('demo_positions')
          .select('*')
          .eq('demo_account_id', demoAccount.id)
          .eq('symbol', params.symbol)
          .single();

        if (pos) {
          const existingQty = Number(pos.quantity);
          const avgCost = Number(pos.avg_cost);
          const newQty = existingQty - fillResult.fillQuantity;
          const realizedPnlDelta = (fillResult.fillPrice - avgCost) * fillResult.fillQuantity;
          const totalRealizedPnl = Number(pos.realized_pnl) + realizedPnlDelta;

          if (newQty <= 0) {
            // Position fully closed
            await supabase
              .from('demo_positions')
              .update({
                quantity: 0,
                market_value: 0,
                unrealized_pnl: 0,
                realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
                updated_at: new Date().toISOString(),
              })
              .eq('id', pos.id);
          } else {
            const newMarketValue = newQty * lastPrice;
            const newUnrealizedPnl = (lastPrice - avgCost) * newQty;

            await supabase
              .from('demo_positions')
              .update({
                quantity: newQty,
                market_price: lastPrice,
                market_value: Math.round(newMarketValue * 100) / 100,
                unrealized_pnl: Math.round(newUnrealizedPnl * 100) / 100,
                realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
                updated_at: new Date().toISOString(),
              })
              .eq('id', pos.id);
          }
        }
      }

      // 12. Insert cash ledger entry
      const cashDebit = params.side === 'BUY' ? netAmount : 0;
      const cashCredit = params.side === 'SELL' ? netAmount : 0;
      const newCashBalance = demoAccount.available_cash - cashDebit + cashCredit;

      await supabase.from('demo_cash_ledger').insert({
        demo_account_id: demoAccount.id,
        entry_type: params.side === 'BUY' ? 'trade_buy' : 'trade_sell',
        reference_type: 'demo_trade',
        reference_id: trade.id,
        debit: cashDebit,
        credit: cashCredit,
        balance_after: Math.round(newCashBalance * 100) / 100,
        narration: `${params.side} ${fillResult.fillQuantity} ${params.symbol} @ ৳${fillResult.fillPrice.toFixed(2)}`,
      });

      // 13. Update demo account balances
      const { data: allPositions } = await supabase
        .from('demo_positions')
        .select('market_value, unrealized_pnl, realized_pnl')
        .eq('demo_account_id', demoAccount.id);

      const totalMarketValue = (allPositions || []).reduce((s, p) => s + Number(p.market_value), 0);
      const totalUnrealizedPnl = (allPositions || []).reduce((s, p) => s + Number(p.unrealized_pnl), 0);
      const totalRealizedPnl = (allPositions || []).reduce((s, p) => s + Number(p.realized_pnl), 0);

      await supabase
        .from('demo_accounts')
        .update({
          available_cash: Math.round(newCashBalance * 100) / 100,
          buying_power: Math.round(newCashBalance * 100) / 100,
          market_value: Math.round(totalMarketValue * 100) / 100,
          unrealized_pnl: Math.round(totalUnrealizedPnl * 100) / 100,
          realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', demoAccount.id);

      return { order: { ...order, status: 'filled' as const }, filled: true, trade };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['demo-orders'] });
      queryClient.invalidateQueries({ queryKey: ['demo-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['demo-cash-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['demo-account'] });
      queryClient.invalidateQueries({ queryKey: ['demo-trades'] });
      queryClient.invalidateQueries({ queryKey: ['coaching-events'] });
      await refreshAccount();
    },
  });
}

// ── Mutation: Cancel an open order ──

export function useCancelDemoOrder() {
  const { demoAccount } = useDemo();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!demoAccount) throw new Error('No demo account');

      const { data: order, error: fetchError } = await supabase
        .from('demo_orders')
        .select('*')
        .eq('id', orderId)
        .eq('demo_account_id', demoAccount.id)
        .single();

      if (fetchError) throw fetchError;

      const cancellableStatuses = ['submitted', 'queued', 'partially_filled'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new Error(`Cannot cancel order with status "${order.status}"`);
      }

      const { error } = await supabase
        .from('demo_orders')
        .update({
          status: 'cancelled',
          executed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
      return { ...order, status: 'cancelled' } as DemoOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-orders'] });
      queryClient.invalidateQueries({ queryKey: ['coaching-events'] });
    },
  });
}

// ── Helper: get default fee rules (avoids circular import) ──

async function getDefaultRules(): Promise<FeeRule[]> {
  const { DEFAULT_FEE_RULES } = await import('@/services/feeCalculator');
  return DEFAULT_FEE_RULES;
}
