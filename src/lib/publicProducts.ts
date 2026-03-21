import { Product, ProductVariant } from '../types';

type ProductRow = {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  images?: string[] | null;
  price_per_kg: number;
  stock: number;
  variety: string;
  origin: string;
  taste_profile?: string | null;
  is_available: boolean;
  variants: ProductVariant[] | null;
};

type StorefrontProductFilters = {
  search?: string;
  variety?: string;
  limit?: number;
};

const requestCache = new Map<string, Promise<ProductRow[]>>();

const STOREFRONT_PRODUCT_SELECT =
  'id,name,image,price_per_kg,stock,variety,origin,is_available,variants';
const PRODUCT_DETAIL_SELECT =
  'id,name,description,image,images,price_per_kg,stock,variety,origin,taste_profile,is_available,variants';

function getSupabaseRestConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function mapPublicProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    image: row.image,
    images: row.images ?? undefined,
    pricePerKg: row.price_per_kg,
    stock: row.stock,
    variety: row.variety,
    origin: row.origin,
    tasteProfile: row.taste_profile ?? '',
    isAvailable: row.is_available,
    variants: row.variants ?? [{ weight: '1kg', price: row.price_per_kg }],
  };
}

async function requestProducts(query: string, signal?: AbortSignal) {
  if (!signal) {
    const cachedRequest = requestCache.get(query);
    if (cachedRequest) {
      return cachedRequest;
    }
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig();
  const request = fetch(`${supabaseUrl}/rest/v1/products?${query}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load products (${response.status})`);
      }

      return response.json() as Promise<ProductRow[]>;
    })
    .finally(() => {
      requestCache.delete(query);
    });

  if (!signal) {
    requestCache.set(query, request);
  }

  return request;
}

export async function fetchStorefrontProducts(filters?: StorefrontProductFilters, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set('select', STOREFRONT_PRODUCT_SELECT);
  params.set('order', 'name.asc');

  const search = filters?.search?.trim();
  if (search) {
    params.set('or', `(name.ilike.%${search}%,variety.ilike.%${search}%)`);
  }

  const variety = filters?.variety?.trim();
  if (variety && variety !== 'All') {
    params.set('variety', `eq.${variety}`);
  }

  if (filters?.limit && filters.limit > 0) {
    params.set('limit', String(filters.limit));
  }

  const rows = (await requestProducts(params.toString(), signal)) as ProductRow[];
  return rows.map(mapPublicProductRow);
}

export async function fetchStorefrontProductById(productId: string, signal?: AbortSignal) {
  const rows = (await requestProducts(
    `select=${PRODUCT_DETAIL_SELECT}&id=eq.${encodeURIComponent(productId)}&limit=1`,
    signal
  )) as ProductRow[];

  const row = rows[0];
  return row ? mapPublicProductRow(row) : null;
}
