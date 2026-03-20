import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getLocalDevProducts,
  isLocalDevAdminMode,
  LOCAL_DEV_PRODUCTS_UPDATED_EVENT,
} from '../lib/localDevProducts';
import { fetchStorefrontProducts } from '../lib/publicProducts';
import { STOREFRONT_PRODUCTS_CACHE_KEY, STOREFRONT_PRODUCTS_CHANGED_EVENT } from '../lib/storefrontSync';
import { hasSupabaseConfig } from '../lib/env';
import { Product } from '../types';
import { queryClient } from '../lib/queryClient';

const CACHE_TTL_MS = 5 * 60 * 1000;
const LEGACY_CACHE_KEY = STOREFRONT_PRODUCTS_CACHE_KEY;
const PERSISTENT_CACHE_KEY = `${STOREFRONT_PRODUCTS_CACHE_KEY}:persistent`;

type UseProductsOptions = {
  search?: string;
  variety?: string;
};

function readStorageCache(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    if (!raw) return null;

    return JSON.parse(raw) as { products: Product[]; timestamp: number };
  } catch {
    return null;
  }
}

function readCachedProducts() {
  const parsed = readStorageCache(PERSISTENT_CACHE_KEY) ?? readStorageCache(LEGACY_CACHE_KEY);
  if (!parsed) {
    return null;
  }

  const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
  return isFresh ? parsed.products : null;
}

function writeCachedProducts(products: Product[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextCache = { products, timestamp: Date.now() };

  try {
    window.sessionStorage.setItem(STOREFRONT_PRODUCTS_CACHE_KEY, JSON.stringify(nextCache));
    window.localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Ignore cache write failures.
  }
}

export function useProducts(options?: UseProductsOptions) {
  const localDevMode = isLocalDevAdminMode();
  const search = options?.search?.trim() ?? '';
  const variety = options?.variety?.trim() ?? '';
  const queryKey = ['storefront-products', search, variety] as const;
  const isDefaultQuery = search.length === 0 && variety.length === 0;

  useEffect(() => {
    const handleRefresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['storefront-products'] });
    };

    if (localDevMode) {
      window.addEventListener('storage', handleRefresh);
      window.addEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, handleRefresh);
      window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);

      return () => {
        window.removeEventListener('storage', handleRefresh);
        window.removeEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, handleRefresh);
        window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
      };
    }

    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
    };
  }, [localDevMode]);

  const query = useQuery({
    queryKey,
    enabled: localDevMode || hasSupabaseConfig,
    initialData: isDefaultQuery ? readCachedProducts() ?? undefined : undefined,
    queryFn: async ({ signal }) => {
      if (localDevMode) {
        return getLocalDevProducts();
      }

      const nextProducts = await fetchStorefrontProducts(
        {
          search,
          variety,
        },
        signal
      );

      if (isDefaultQuery) {
        writeCachedProducts(nextProducts);
      }

      return nextProducts;
    },
  });

  return {
    products: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? 'Could not load the product catalog.' : hasSupabaseConfig ? null : 'Store configuration is incomplete.',
  };
}
