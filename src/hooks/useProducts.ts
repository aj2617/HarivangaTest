import { useEffect, useState } from 'react';
import {
  getLocalDevProducts,
  getMockProducts,
  isLocalDevAdminMode,
  LOCAL_DEV_PRODUCTS_UPDATED_EVENT,
} from '../lib/localDevProducts';
import { fetchStorefrontProducts } from '../lib/publicProducts';
import { STOREFRONT_PRODUCTS_CACHE_KEY, STOREFRONT_PRODUCTS_CHANGED_EVENT } from '../lib/storefrontSync';
import { hasSupabaseConfig } from '../lib/env';
import { Product } from '../types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const LEGACY_CACHE_KEY = STOREFRONT_PRODUCTS_CACHE_KEY;
const PERSISTENT_CACHE_KEY = `${STOREFRONT_PRODUCTS_CACHE_KEY}:persistent`;
const memoryCache = new Map<string, { products: Product[]; timestamp: number }>();

type UseProductsOptions = {
  search?: string;
  variety?: string;
  limit?: number;
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
  const inMemory = memoryCache.get(PERSISTENT_CACHE_KEY);
  if (inMemory && Date.now() - inMemory.timestamp < CACHE_TTL_MS) {
    return inMemory.products;
  }

  const parsed = readStorageCache(PERSISTENT_CACHE_KEY) ?? readStorageCache(LEGACY_CACHE_KEY);
  if (!parsed) {
    return null;
  }

  const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
  return isFresh ? parsed.products : null;
}

function writeCachedProducts(products: Product[]) {
  memoryCache.set(PERSISTENT_CACHE_KEY, { products, timestamp: Date.now() });

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

function getCacheKey(search: string, variety: string, limit?: number) {
  return JSON.stringify(['storefront-products', search, variety, limit ?? null]);
}

export function getCachedStorefrontProducts() {
  return readCachedProducts() ?? [];
}

export function useProducts(options?: UseProductsOptions) {
  const localDevMode = isLocalDevAdminMode();
  const search = options?.search?.trim() ?? '';
  const variety = options?.variety?.trim() ?? '';
  const limit = options?.limit;
  const isDefaultQuery = search.length === 0 && variety.length === 0 && limit == null;
  const cacheKey = getCacheKey(search, variety, limit);
  const [products, setProducts] = useState<Product[]>(() => {
    if (isDefaultQuery) {
      return readCachedProducts() ?? [];
    }

    return memoryCache.get(cacheKey)?.products ?? [];
  });
  const [loading, setLoading] = useState(localDevMode || hasSupabaseConfig);
  const [error, setError] = useState<string | null>(hasSupabaseConfig ? null : 'Store configuration is incomplete.');

  useEffect(() => {
    let cancelled = false;

    const applyFallbackProducts = async () => {
      const fallbackProducts = await getMockProducts();

      if (cancelled) {
        return;
      }

      const filteredFallbackProducts = fallbackProducts.filter((product) => {
        const matchesSearch =
          search.length === 0
          || product.name.toLowerCase().includes(search.toLowerCase())
          || product.variety.toLowerCase().includes(search.toLowerCase());
        const matchesVariety = variety.length === 0 || variety === 'All' || product.variety === variety;

        return matchesSearch && matchesVariety;
      });

      const limitedFallbackProducts = typeof limit === 'number'
        ? filteredFallbackProducts.slice(0, limit)
        : filteredFallbackProducts;

      memoryCache.set(cacheKey, { products: limitedFallbackProducts, timestamp: Date.now() });
      if (isDefaultQuery) {
        writeCachedProducts(limitedFallbackProducts);
      }

      setProducts(limitedFallbackProducts);
      setError(null);
      setLoading(false);
    };

    const loadProducts = async (forceRefresh = false) => {
      if (!localDevMode && !hasSupabaseConfig) {
        await applyFallbackProducts();
        return;
      }

      if (localDevMode) {
        setProducts(await getLocalDevProducts());
        setLoading(false);
        setError(null);
        return;
      }

      const cachedEntry = !forceRefresh ? memoryCache.get(cacheKey) : null;
      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        setProducts(cachedEntry.products);
        setLoading(false);
        setError(null);
        return;
      }

      if (isDefaultQuery) {
        const storageCache = !forceRefresh ? readCachedProducts() : null;
        if (storageCache) {
          memoryCache.set(cacheKey, { products: storageCache, timestamp: Date.now() });
          setProducts(storageCache);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const nextProducts = await fetchStorefrontProducts({ search, variety, limit });

        if (cancelled) {
          return;
        }

        if (nextProducts.length === 0 && isDefaultQuery) {
          await applyFallbackProducts();
          return;
        }

        memoryCache.set(cacheKey, { products: nextProducts, timestamp: Date.now() });
        if (isDefaultQuery) {
          writeCachedProducts(nextProducts);
        }
        setProducts(nextProducts);
      } catch (fetchError) {
        console.error('Could not load storefront products.', fetchError);
        await applyFallbackProducts();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleRefresh = () => {
      memoryCache.delete(cacheKey);
      if (isDefaultQuery) {
        memoryCache.delete(PERSISTENT_CACHE_KEY);
      }
      void loadProducts(true);
    };

    if (localDevMode) {
      void loadProducts();
      window.addEventListener('storage', handleRefresh);
      window.addEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, handleRefresh);
      window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);

      return () => {
        window.removeEventListener('storage', handleRefresh);
        window.removeEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, handleRefresh);
        window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
      };
    }

    void loadProducts();
    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleRefresh);
    };
  }, [cacheKey, isDefaultQuery, limit, localDevMode, search, variety]);

  return {
    products,
    loading,
    error,
  };
}
