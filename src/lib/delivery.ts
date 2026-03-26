import { CartItem } from '../types';

export type DeliveryMethod = 'Home Delivery' | 'Courier Pickup';

export const DELIVERY_RATE_PER_KG: Record<DeliveryMethod, number> = {
  'Home Delivery': 110,
  'Courier Pickup': 100,
};

export function getVariantWeightKg(variant: string) {
  const match = variant.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (!match) {
    return 1;
  }

  const weight = Number(match[1]);
  return Number.isFinite(weight) && weight > 0 ? weight : 1;
}

export function getCartTotalWeightKg(cart: CartItem[]) {
  return cart.reduce((total, item) => total + getVariantWeightKg(item.variant) * item.quantity, 0);
}

export function calculateDeliveryCharge(cart: CartItem[], method: DeliveryMethod) {
  const totalWeightKg = getCartTotalWeightKg(cart);
  return Math.round(totalWeightKg * DELIVERY_RATE_PER_KG[method]);
}
