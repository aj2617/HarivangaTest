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
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/products?${query}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  return response.json();
}

export async function fetchStorefrontProducts(signal?: AbortSignal) {
  const rows = (await requestProducts(`select=${STOREFRONT_PRODUCT_SELECT}&order=name.asc`, signal)) as ProductRow[];
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
