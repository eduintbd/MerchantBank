import type { DemoOrder, DemoOrderSide, DemoOrderType, DemoAccount } from '@/types/demo';

export interface SimulationResult {
  canFill: boolean;
  fillPrice: number;
  fillQuantity: number;
  rejectionReason: string | null;
}

/**
 * Validate whether an order can be placed given account state.
 */
export function validateOrder(params: {
  side: DemoOrderSide;
  orderType: DemoOrderType;
  quantity: number;
  limitPrice: number | null;
  lastPrice: number;
  account: DemoAccount;
  currentPosition?: number;
}): { valid: boolean; reason: string | null } {
  const { side, orderType, quantity, limitPrice, lastPrice, account, currentPosition = 0 } = params;

  if (quantity <= 0 || !Number.isFinite(quantity)) {
    return { valid: false, reason: 'Invalid quantity. Must be a positive number.' };
  }

  if (quantity % 1 !== 0) {
    return { valid: false, reason: 'Quantity must be a whole number.' };
  }

  if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
    return { valid: false, reason: 'Limit orders require a positive limit price.' };
  }

  if (lastPrice <= 0) {
    return { valid: false, reason: 'Symbol is currently inactive or has no price data.' };
  }

  if (side === 'BUY') {
    const estimatedCost = quantity * (orderType === 'LIMIT' ? (limitPrice || lastPrice) : lastPrice);
    if (estimatedCost > account.buying_power) {
      return { valid: false, reason: `Insufficient buying power. Required: ৳${estimatedCost.toFixed(2)}, Available: ৳${account.buying_power.toFixed(2)}` };
    }
  }

  if (side === 'SELL') {
    if (currentPosition < quantity) {
      return { valid: false, reason: `Insufficient holdings. You own ${currentPosition} shares but tried to sell ${quantity}.` };
    }
  }

  return { valid: true, reason: null };
}

/**
 * Simulate order fill based on market conditions.
 * Market orders fill at last price ± slippage.
 * Limit orders fill when price crosses limit.
 */
export function simulateFill(params: {
  side: DemoOrderSide;
  orderType: DemoOrderType;
  quantity: number;
  limitPrice: number | null;
  lastPrice: number;
  highPrice: number;
  lowPrice: number;
  slippageBps?: number;
}): SimulationResult {
  const { side, orderType, quantity, limitPrice, lastPrice, highPrice, lowPrice, slippageBps = 5 } = params;

  if (orderType === 'MARKET') {
    // Market orders fill immediately with small slippage
    const slippage = lastPrice * (slippageBps / 10000);
    const fillPrice = side === 'BUY'
      ? Math.round((lastPrice + slippage) * 100) / 100
      : Math.round((lastPrice - slippage) * 100) / 100;

    return {
      canFill: true,
      fillPrice: Math.max(fillPrice, 0.01),
      fillQuantity: quantity,
      rejectionReason: null,
    };
  }

  // LIMIT order logic
  if (side === 'BUY') {
    // Buy limit fills when price drops to or below limit
    if (limitPrice! >= lowPrice) {
      return {
        canFill: true,
        fillPrice: Math.min(limitPrice!, lastPrice),
        fillQuantity: quantity,
        rejectionReason: null,
      };
    }
  } else {
    // Sell limit fills when price rises to or above limit
    if (limitPrice! <= highPrice) {
      return {
        canFill: true,
        fillPrice: Math.max(limitPrice!, lastPrice),
        fillQuantity: quantity,
        rejectionReason: null,
      };
    }
  }

  return {
    canFill: false,
    fillPrice: 0,
    fillQuantity: 0,
    rejectionReason: null, // Not rejected, just not filled yet
  };
}

/**
 * Generate human-readable explanation for an order's status.
 */
export function explainOrderStatus(order: DemoOrder): string {
  switch (order.status) {
    case 'draft':
      return 'This order has been created but not yet submitted to the market.';
    case 'submitted':
      return 'Your order has been submitted and is being processed by the exchange.';
    case 'queued':
      return 'Your order is queued and waiting for a matching price in the market.';
    case 'partially_filled':
      return `${order.filled_quantity} of ${order.quantity} shares have been filled at an average price of ৳${order.avg_fill_price.toFixed(2)}. The remaining quantity is still pending.`;
    case 'filled':
      return `Order fully filled! ${order.quantity} shares ${order.side === 'BUY' ? 'bought' : 'sold'} at ৳${order.avg_fill_price.toFixed(2)} per share.`;
    case 'cancelled':
      return 'This order was cancelled before it could be filled.';
    case 'rejected':
      return `Order rejected: ${order.rejected_reason || 'Unknown reason'}. No shares were traded and no charges were applied.`;
    case 'expired':
      return 'This order expired at end of day because the limit price was not reached.';
    default:
      return 'Order status unknown.';
  }
}
