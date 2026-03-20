import { useEffect, useState } from 'react';
import {
  getLocalDevProducts,
  isLocalDevAdminMode,
  LOCAL_DEV_PRODUCTS_UPDATED_EVENT,
} from '../lib/localDevProducts';
import { STOREFRONT_PRODUCTS_CACHE_KEY, STOREFRONT_PRODUCTS_CHANGED_EVENT } from '../lib/storefrontSync';
import { hasSupabaseConfig } from '../lib/env';
import { Product } from '../types';

const CACHE_TTL_MS = 5 * 60 * 1000;

type ProductVariant = {
  weight: string;
  price: number;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  image: string;
  images: string[] | null;
  price_per_kg: number;
  stock: number;
  variety: string;
  origin: string;
  taste_profile: string;
  is_available: boolean;
  variants: ProductVariant[] | null;
};

let memoryCache: { products: Product[]; timestamp: number } | null = null;

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    images: row.images ?? undefined,
    pricePerKg: row.price_per_kg,
    stock: row.stock,
    variety: row.variety,
    origin: row.origin,
    tasteProfile: row.taste_profile,
    isAvailable: row.is_available,
    variants: row.variants ?? [{ weight: '1kg', price: row.price_per_kg }],
  };
}

async function fetchProducts(signal?: AbortSignal) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=name.asc`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  const rows = (await response.json()) as ProductRow[];
  return rows.map(mapProductRow);
}

function readCachedProducts() {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.products;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STOREFRONT_PRODUCTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { products: Product[]; timestamp: number };
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(STOREFRONT_PRODUCTS_CACHE_KEY);
      return null;
    }

    memoryCache = parsed;
    return parsed.products;
  } catch {
    return null;
  }
}

function writeCachedProducts(products: Product[]) {
  const nextCache = { products, timestamp: Date.now() };
  memoryCache = nextCache;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STOREFRONT_PRODUCTS_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Ignore cache write failures.
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => readCachedProducts() ?? []);
  const [loading, setLoading] = useState(() => readCachedProducts() == null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const win = typeof window !== 'undefined' ? window : null;
    const localDevMode = isLocalDevAdminMode();
    const abortController = new AbortController();

    const refreshLocalProducts = () => {
      const nextProducts = getLocalDevProducts();
      writeCachedProducts(nextProducts);
      setProducts(nextProducts);
      setLoading(false);
    };

    if (localDevMode) {
      refreshLocalProducts();
      window.addEventListener('storage', refreshLocalProducts);
      window.addEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, refreshLocalProducts);
      window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshLocalProducts);

      return () => {
        window.removeEventListener('storage', refreshLocalProducts);
        window.removeEventListener(LOCAL_DEV_PRODUCTS_UPDATED_EVENT, refreshLocalProducts);
        window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshLocalProducts);
      };
    }

    const loadProducts = async () => {
      try {
        const nextProducts = await fetchProducts(abortController.signal);
        writeCachedProducts(nextProducts);
        setError(null);
        setProducts(nextProducts);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('Failed to load storefront products', error);
        setError('Could not load the product catalog.');
        setProducts([]);
      }
      setLoading(false);
    };

    if (!hasSupabaseConfig) {
      setProducts([]);
      setError('Store configuration is incomplete.');
      setLoading(false);
      return;
    }

    const cachedProducts = readCachedProducts();
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      void loadProducts();
    } else {
      void loadProducts();
    }

    const handleStorefrontRefresh = () => {
      void loadProducts();
    };
    win?.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleStorefrontRefresh);

    return () => {
      abortController.abort();
      win?.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, handleStorefrontRefresh);
    };
  }, []);

  return { products, loading, error };
}
