import { supabase } from './supabase';
import type { BrokerConnection, BrokerOrder } from '@/types';

interface BrokerOrderRequest {
  order_id: string;
  client_code: string;
  portfolio_id: string;
  symbol: string;
  isin?: string;
  exchange: 'DSE' | 'CSE';
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  limit_price?: number;
  time_in_force?: 'DAY' | 'IOC' | 'GTC';
  board?: 'PUBLIC' | 'BLOCK' | 'SPOT';
  notes?: string;
  timestamp: string;
}

interface BrokerOrderResponse {
  status: 'accepted' | 'rejected' | 'pending';
  broker_order_id?: string;
  abaci_order_id: string;
  received_at: string;
  rejection_reason?: string;
}

interface BrokerPositionRecord {
  client_code: string;
  symbol: string;
  isin?: string;
  total_qty: number;
  saleable_qty: number;
  avg_cost: number;
  market_price: number;
  market_value: number;
  unsettled_buy_qty: number;
  unsettled_sell_qty: number;
  as_of_date: string;
}

interface BrokerApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

async function getBrokerConfig(brokerId: string): Promise<BrokerConnection | null> {
  const { data } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('id', brokerId)
    .single();
  return data as BrokerConnection | null;
}

async function brokerFetch(
  broker: BrokerConnection,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!broker.api_base_url) {
    throw new Error(`Broker ${broker.broker_name} has no API URL configured`);
  }

  const url = `${broker.api_base_url}/${broker.api_version}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Abaci-Client': 'abaci-investments',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: BrokerApiError = await response.json().catch(() => ({
      code: 'UNKNOWN',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new BrokerApiClientError(error.code, error.message, response.status, error.details);
  }

  return response;
}

export class BrokerApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BrokerApiClientError';
  }
}

export async function submitOrder(
  brokerId: string,
  order: BrokerOrderRequest
): Promise<BrokerOrderResponse> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  if (broker.status === 'disconnected' || broker.status === 'suspended') {
    throw new Error(`Broker ${broker.broker_name} is ${broker.status}`);
  }

  const response = await brokerFetch(broker, '/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });

  return response.json();
}

export async function getOrderStatus(
  brokerId: string,
  abaciOrderId: string
): Promise<{ status: string; filled_qty: number; avg_fill_price: number; leaves_qty: number }> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  const response = await brokerFetch(broker, `/orders/${abaciOrderId}`);
  return response.json();
}

export async function cancelOrder(
  brokerId: string,
  abaciOrderId: string
): Promise<{ status: string; message: string }> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  const response = await brokerFetch(broker, `/orders/${abaciOrderId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getPositions(
  brokerId: string,
  clientCode: string,
  date?: string
): Promise<BrokerPositionRecord[]> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  const params = date ? `?date=${date}` : '';
  const response = await brokerFetch(broker, `/positions/${clientCode}${params}`);
  return response.json();
}

export async function getAllPositions(
  brokerId: string,
  date: string
): Promise<BrokerPositionRecord[]> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  const response = await brokerFetch(broker, `/positions?date=${date}`);
  return response.json();
}

export async function getSettlements(
  brokerId: string,
  date: string
): Promise<unknown[]> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  const response = await brokerFetch(broker, `/settlements?date=${date}`);
  return response.json();
}

export async function getDailyReconciliation(
  brokerId: string,
  date: string
): Promise<unknown> {
  const broker = await getBrokerConfig(brokerId);
  if (!broker) throw new Error('Broker not found');

  const response = await brokerFetch(broker, `/reconciliation/daily?date=${date}`);
  return response.json();
}

export async function createAndSubmitOrder(
  brokerId: string,
  orderData: {
    portfolioId: string;
    clientId: string;
    clientCode: string;
    symbol: string;
    exchange: 'DSE' | 'CSE';
    side: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT';
    quantity: number;
    limitPrice?: number;
    board?: 'PUBLIC' | 'BLOCK' | 'SPOT';
    notes?: string;
    createdBy: string;
  }
): Promise<BrokerOrder> {
  const { data: order, error: insertErr } = await supabase
    .from('broker_orders')
    .insert({
      broker_id: brokerId,
      portfolio_id: orderData.portfolioId,
      client_id: orderData.clientId,
      symbol: orderData.symbol,
      exchange: orderData.exchange,
      side: orderData.side,
      order_type: orderData.orderType,
      quantity: orderData.quantity,
      limit_price: orderData.limitPrice,
      board: orderData.board || 'PUBLIC',
      status: 'DRAFT',
      remaining_qty: orderData.quantity,
      created_by: orderData.createdBy,
      notes: orderData.notes,
    })
    .select()
    .single();

  if (insertErr || !order) throw new Error(insertErr?.message || 'Failed to create order');

  try {
    const response = await submitOrder(brokerId, {
      order_id: order.abaci_order_id,
      client_code: orderData.clientCode,
      portfolio_id: orderData.portfolioId,
      symbol: orderData.symbol,
      exchange: orderData.exchange,
      side: orderData.side,
      order_type: orderData.orderType,
      quantity: orderData.quantity,
      limit_price: orderData.limitPrice,
      board: orderData.board,
      notes: orderData.notes,
      timestamp: new Date().toISOString(),
    });

    await supabase
      .from('broker_orders')
      .update({
        status: response.status === 'accepted' ? 'ACCEPTED' : response.status === 'rejected' ? 'REJECTED' : 'SUBMITTED',
        broker_order_id: response.broker_order_id,
        submitted_at: new Date().toISOString(),
        accepted_at: response.status === 'accepted' ? new Date().toISOString() : null,
        rejection_reason: response.rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return { ...order, status: response.status === 'accepted' ? 'ACCEPTED' : 'SUBMITTED' } as BrokerOrder;
  } catch (err) {
    await supabase
      .from('broker_orders')
      .update({
        status: 'REJECTED',
        rejection_reason: err instanceof Error ? err.message : 'Submission failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    throw err;
  }
}

export async function processExecution(executionId: string): Promise<void> {
  const { data: exec } = await supabase
    .from('broker_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (!exec || exec.processing_status !== 'received') return;

  try {
    if (exec.abaci_order_id) {
      const { data: order } = await supabase
        .from('broker_orders')
        .select('*')
        .eq('abaci_order_id', exec.abaci_order_id)
        .single();

      if (order) {
        const newFilledQty = order.filled_qty + exec.exec_qty;
        const newAvgPrice = order.filled_qty > 0
          ? ((order.avg_fill_price * order.filled_qty) + (exec.exec_price * exec.exec_qty)) / newFilledQty
          : exec.exec_price;

        await supabase.from('broker_orders').update({
          filled_qty: newFilledQty,
          avg_fill_price: newAvgPrice,
          remaining_qty: order.quantity - newFilledQty,
          status: newFilledQty >= order.quantity ? 'FILLED' : 'PARTIALLY_FILLED',
          first_fill_at: order.first_fill_at || new Date().toISOString(),
          last_fill_at: new Date().toISOString(),
          completed_at: newFilledQty >= order.quantity ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('id', order.id);

        await supabase.from('broker_executions').update({
          broker_order_ref: order.id,
          processing_status: 'matched',
          processed_at: new Date().toISOString(),
        }).eq('id', executionId);
      }
    }

    if (exec.client_id && exec.portfolio_id && exec.exec_type === 'FILL') {
      const { data: txn } = await supabase.from('portfolio_transactions').insert({
        portfolio_id: exec.portfolio_id,
        client_id: exec.client_id,
        transaction_type: exec.side.toLowerCase(),
        symbol: exec.symbol,
        isin: exec.isin,
        quantity: exec.exec_qty,
        price: exec.exec_price,
        gross_value: exec.gross_value,
        commission: exec.commission,
        exchange_fee: exec.exchange_fee,
        cdbl_fee: exec.cdbl_fee,
        ait: exec.ait,
        net_value: exec.net_value,
        trade_date: exec.trade_date,
        settlement_date: exec.settlement_date,
        source: 'broker_api',
        broker_ref: exec.exec_id,
        broker_name: undefined,
        status: 'confirmed',
      }).select().single();

      if (txn) {
        await supabase.from('broker_executions').update({
          matched_transaction_id: txn.id,
          processing_status: 'applied',
          processed_at: new Date().toISOString(),
        }).eq('id', executionId);
      }
    }
  } catch (err) {
    await supabase.from('broker_executions').update({
      processing_status: 'failed',
      error_message: err instanceof Error ? err.message : 'Processing failed',
      processed_at: new Date().toISOString(),
    }).eq('id', executionId);
  }
}
