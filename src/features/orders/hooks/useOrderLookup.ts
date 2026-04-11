import { useEffect, useState } from 'react';
import { mapOrderRow, ORDER_SELECT, supabase } from '../../../supabase';
import { getLocalDevOrderById } from '../../../lib/localDevOrders';
import { getRecentOrderById, saveRecentOrder } from '../../../lib/recentOrders';
import { hasSupabaseConfig } from '../../../lib/env';
import { Order } from '../../../types';

type UseOrderLookupOptions = {
  orderId?: string;
  userId?: string | null;
  isAdmin?: boolean;
};

export function useOrderLookup({ orderId, userId, isAdmin = false }: UseOrderLookupOptions) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | null = null;

    async function loadOrder(showLoader = true) {
      if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const recentOrder = getRecentOrderById(orderId);
        if (recentOrder) {
          if (!cancelled) {
            setOrder(recentOrder);
          }
        }

        const localOrder = getLocalDevOrderById(orderId);
        if (localOrder) {
          if (!cancelled) {
            setOrder(localOrder);
            setLoading(false);
          }
          return;
        }

        if (!hasSupabaseConfig) {
          if (!cancelled) {
            setOrder(null);
            setLoading(false);
          }
          return;
        }

        let data: unknown = null;
        let error: Error | null = null;

        if (isAdmin || userId) {
          let query = supabase
            .from('orders')
            .select(ORDER_SELECT)
            .eq('id', orderId);

          if (!isAdmin && userId) {
            query = query.eq('user_id', userId);
          }

          const result = await query.maybeSingle();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase.rpc('track_order_by_id', { p_order_id: orderId });
          data = result.data;
          error = result.error;
        }

        if (error) {
          throw error;
        }

        const mappedOrder = data ? mapOrderRow(data as never) : null;
        if (!cancelled) {
          setOrder(mappedOrder);
        }

        if (mappedOrder) {
          saveRecentOrder(mappedOrder);
        }
      } catch (error) {
        console.error('Failed to load order', error);
        if (!cancelled) {
          setOrder((current) => current);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();
    if (typeof window !== 'undefined') {
      refreshTimer = window.setInterval(() => {
        void loadOrder(false);
      }, 15000);
    }

    return () => {
      cancelled = true;
      if (refreshTimer !== null) {
        window.clearInterval(refreshTimer);
      }
    };
  }, [isAdmin, orderId, userId]);

  return { order, loading };
}
