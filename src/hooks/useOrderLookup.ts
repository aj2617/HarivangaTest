import { useEffect, useState } from 'react';
import { mapOrderRow, ORDER_SELECT, supabase } from '../supabase';
import { getLocalDevOrderById } from '../lib/localDevOrders';
import { getRecentOrderById } from '../lib/recentOrders';
import { hasSupabaseConfig } from '../lib/env';
import { Order } from '../types';

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

    async function loadOrder() {
      if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const recentOrder = getRecentOrderById(orderId);
        if (recentOrder) {
          if (!cancelled) {
            setOrder(recentOrder);
            setLoading(false);
          }
          return;
        }

        const localOrder = getLocalDevOrderById(orderId);
        if (localOrder) {
          if (!cancelled) {
            setOrder(localOrder);
            setLoading(false);
          }
          return;
        }

        if ((!userId && !isAdmin) || !hasSupabaseConfig) {
          if (!cancelled) {
            setOrder(null);
            setLoading(false);
          }
          return;
        }

        let query = supabase
          .from('orders')
          .select(ORDER_SELECT)
          .eq('id', orderId);

        if (!isAdmin && userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setOrder(data ? mapOrderRow(data) : null);
        }
      } catch (error) {
        console.error('Failed to load order', error);
        if (!cancelled) {
          setOrder(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, orderId, userId]);

  return { order, loading };
}
