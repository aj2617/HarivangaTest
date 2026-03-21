import { createClient, type User } from '@supabase/supabase-js';
import { Order, OrderStatus, Product, ProductVariant, UserProfile } from './types';
import { hasSupabaseConfig } from './lib/env';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'supabase-anon-key';

if (!hasSupabaseConfig) {
  console.warn('Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const auth = supabase.auth;

export const USER_PROFILE_SELECT = 'id,name,phone,email,role,saved_addresses';
export const ORDER_SELECT =
  'id,customer_name,customer_phone,customer_phone_normalized,delivery_address,delivery_area,delivery_division,delivery_district,delivery_location,delivery_method,delivery_date,payment_method,items,subtotal,delivery_charge,total,status,created_at,user_id';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Supabase Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Authentication failed. Please try again.';
  }

  const message = error.message.toLowerCase();
  if (message.includes('popup') || message.includes('redirect')) {
    return 'Authentication could not be completed. Please try again.';
  }
  if (message.includes('network')) {
    return 'Network error while signing in. Check your internet connection and try again.';
  }
  if (message.includes('provider')) {
    return 'The selected authentication method is not enabled in Supabase Authentication.';
  }
  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('email not confirmed')) {
    return 'Confirm your email address before signing in.';
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  return error.message;
}

function ensureSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

export async function signInWithGoogle() {
  ensureSupabaseConfig();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  ensureSupabaseConfig();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  ensureSupabaseConfig();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: name ? { name } : undefined,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser() {
  ensureSupabaseConfig();

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export type AuthUser = User;

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

type OrderItemRow = {
  productId: string;
  productName: string;
  quantity: number;
  variant: string;
  price: number;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_normalized: string | null;
  delivery_address: string;
  delivery_area: string;
  delivery_division: string | null;
  delivery_district: string | null;
  delivery_location: string | null;
  delivery_method: 'Home Delivery' | 'Courier Pickup' | null;
  delivery_date: string;
  payment_method: 'bKash' | 'Nagad' | 'Cash on Delivery';
  items: OrderItemRow[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  user_id: string | null;
};

type UserProfileRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: 'admin' | 'customer';
  saved_addresses: string[] | null;
};

export function mapProductRow(row: ProductRow): Product {
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

export function mapProductToRow(product: Partial<Product>) {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    image: product.image ?? '',
    images: product.images ?? null,
    price_per_kg: product.pricePerKg ?? 0,
    stock: product.stock ?? 0,
    variety: product.variety ?? '',
    origin: product.origin ?? '',
    taste_profile: product.tasteProfile ?? '',
    is_available: product.isAvailable ?? false,
    variants: product.variants ?? [{ weight: '1kg', price: product.pricePerKg ?? 0 }],
  };
}

export function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPhoneNormalized: row.customer_phone_normalized ?? undefined,
    deliveryAddress: row.delivery_address,
    deliveryArea: row.delivery_area,
    deliveryDivision: row.delivery_division ?? undefined,
    deliveryDistrict: row.delivery_district ?? undefined,
    deliveryLocation: row.delivery_location ?? undefined,
    deliveryMethod: row.delivery_method ?? undefined,
    deliveryDate: row.delivery_date,
    paymentMethod: row.payment_method,
    items: row.items,
    subtotal: row.subtotal,
    deliveryCharge: row.delivery_charge,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id ?? undefined,
  };
}

export function mapOrderToRow(order: Omit<Order, 'id'>) {
  return {
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_phone_normalized: order.customerPhoneNormalized ?? null,
    delivery_address: order.deliveryAddress,
    delivery_area: order.deliveryArea,
    delivery_division: order.deliveryDivision ?? null,
    delivery_district: order.deliveryDistrict ?? null,
    delivery_location: order.deliveryLocation ?? null,
    delivery_method: order.deliveryMethod ?? null,
    delivery_date: order.deliveryDate,
    payment_method: order.paymentMethod,
    items: order.items,
    subtotal: order.subtotal,
    delivery_charge: order.deliveryCharge,
    total: order.total,
    status: order.status,
    created_at: order.createdAt,
    user_id: order.userId ?? null,
  };
}

export function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    uid: row.id,
    name: row.name,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    role: row.role,
    savedAddresses: row.saved_addresses ?? [],
  };
}

export function mapUserProfileToRow(profile: UserProfile) {
  return {
    id: profile.uid,
    name: profile.name,
    phone: profile.phone || null,
    email: profile.email ?? null,
    role: profile.role,
    saved_addresses: profile.savedAddresses,
  };
}
