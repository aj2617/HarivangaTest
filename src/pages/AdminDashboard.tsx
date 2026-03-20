import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleDatabaseError, mapOrderRow, mapProductRow, mapProductToRow, OperationType, supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus } from '../types';
import { MOCK_PRODUCTS } from '../data/mockData';
import { getLocalDevProducts, isLocalDevAdminMode, isLocalDevHost, LOCAL_DEV_ADMIN_KEY, setLocalDevProducts } from '../lib/localDevProducts';
import { getLocalDevOrders, LOCAL_DEV_ORDERS_UPDATED_EVENT, setLocalDevOrders } from '../lib/localDevOrders';
import { notifyStorefrontProductsChanged } from '../lib/storefrontSync';
import { BrandLogo } from '../components/BrandLogo';
import { 
  LayoutDashboard, Package, ShoppingBag, TrendingUp, 
  Plus, Edit2, Trash2, Clock, 
  Search, X, Save, Image as ImageIcon, Settings as SettingsIcon,
  Store, Truck, Wallet, Boxes, ClipboardList, Users, Bell, CalendarDays, House, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { canUseDevelopmentFallbacks } from '../lib/env';

const LOCAL_DEV_ADMIN_EMAIL = 'admin@local';
const LOCAL_DEV_ADMIN_PASSWORD = 'admin1234';
type AdminTab = 'overview' | 'products' | 'orders' | 'settings';
type SettingsSection = 'store' | 'delivery' | 'payments' | 'inventory' | 'orders' | 'users' | 'notifications' | 'availability';
type DeliveryZoneSetting = { id: string; name: string; charge: number };
type AdminUserSetting = { id: string; name: string; email: string; role: 'Admin' | 'Manager' | 'Staff' };

type AdminSettings = {
  storeName: string;
  logoUrl: string;
  website: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  deliveryZoneEntries: DeliveryZoneSetting[];
  deliveryZones: string;
  deliveryCharges: string;
  estimatedDeliveryTime: string;
  minimumOrderAmount: number;
  codEnabled: boolean;
  paymentMethods: string;
  cashPaymentEnabled: boolean;
  mobilePaymentEnabled: boolean;
  cardPaymentEnabled: boolean;
  mobilePaymentSettings: string;
  bankSettings: string;
  lowStockThreshold: number;
  stockAlertEnabled: boolean;
  autoDisableLowStockItems: boolean;
  trackInventory: boolean;
  outOfStockBehavior: 'Hide products' | 'Mark out of stock' | 'Allow backorders';
  defaultOrderStatus: OrderStatus;
  cancellationWindowMinutes: number;
  allowCustomerCancellation: boolean;
  autoConfirmOrders: boolean;
  cancellationRules: string;
  returnRefundNotes: string;
  adminUserEntries: AdminUserSetting[];
  adminUsers: string;
  rolesPermissions: string;
  emailAlertsEnabled: boolean;
  smsAlertsEnabled: boolean;
  emailNewOrderEnabled: boolean;
  emailOrderStatusEnabled: boolean;
  emailLowStockEnabled: boolean;
  smsUrgentOrdersEnabled: boolean;
  smsDailySummaryEnabled: boolean;
  seasonalAvailabilityControl: boolean;
  storeOpen: boolean;
  showOutOfSeasonProducts: boolean;
  autoToggleSeasonalProducts: boolean;
  storeOpensAt: string;
  storeClosesAt: string;
};

const ADMIN_SETTINGS_KEY = 'harivanga_admin_settings';
const LEGACY_ADMIN_SETTINGS_KEY = 'mangobd_admin_settings';
const PRODUCT_ORIGINS = ['Rangpur', 'Rajshahi', 'Podagonj'] as const;
const DEFAULT_PRODUCT_VARIANT = { weight: '1kg', price: 0 };
const DEFAULT_PRODUCT_FORM: Partial<Product> = {
  name: '',
  description: '',
  image: '',
  images: [],
  pricePerKg: 0,
  stock: 999,
  variety: 'Harivanga',
  origin: 'Rangpur',
  tasteProfile: '',
  isAvailable: true,
  variants: [{ ...DEFAULT_PRODUCT_VARIANT }]
};
const DEFAULT_SETTINGS: AdminSettings = {
  storeName: 'Harivanga.com',
  logoUrl: '',
  website: 'https://harivanga.com',
  supportPhone: '+880 1307-367441',
  supportEmail: 'support@harivanga.com',
  address: 'Dhaka, Bangladesh',
  deliveryZoneEntries: [
    { id: 'zone-a', name: 'Zone A (0-5 km)', charge: 80 },
    { id: 'zone-b', name: 'Zone B (5-10 km)', charge: 120 },
    { id: 'zone-c', name: 'Zone C (10-15 km)', charge: 180 },
  ],
  deliveryZones: 'Dhaka Metro, Uttara, Banani, Dhanmondi, Mirpur',
  deliveryCharges: 'Inside Dhaka: ৳80, Express zones: ৳120',
  estimatedDeliveryTime: '48 hours',
  minimumOrderAmount: 500,
  codEnabled: true,
  paymentMethods: 'Cash on Delivery, bKash, Nagad',
  cashPaymentEnabled: true,
  mobilePaymentEnabled: true,
  cardPaymentEnabled: false,
  mobilePaymentSettings: 'Confirm transaction ID before marking prepaid orders as confirmed.',
  bankSettings: 'Bank transfer is available for wholesale or bulk orders.',
  lowStockThreshold: 25,
  stockAlertEnabled: true,
  autoDisableLowStockItems: false,
  trackInventory: true,
  outOfStockBehavior: 'Mark out of stock',
  defaultOrderStatus: 'Pending',
  cancellationWindowMinutes: 30,
  allowCustomerCancellation: true,
  autoConfirmOrders: false,
  cancellationRules: 'Orders may be cancelled before dispatch. Confirmed prepaid orders require manual review.',
  returnRefundNotes: 'Report fruit-quality issues within 24 hours with photos for support review.',
  adminUserEntries: [
    { id: 'admin-user', name: 'Admin User', email: 'admin@harivanga.com', role: 'Admin' },
    { id: 'manager-one', name: 'Manager One', email: 'manager@harivanga.com', role: 'Manager' },
    { id: 'staff-member', name: 'Staff Member', email: 'staff@harivanga.com', role: 'Staff' },
  ],
  adminUsers: 'admin@harivanga.com',
  rolesPermissions: 'Super Admin: full access. Operations Admin: orders and products.',
  emailAlertsEnabled: true,
  smsAlertsEnabled: false,
  emailNewOrderEnabled: true,
  emailOrderStatusEnabled: true,
  emailLowStockEnabled: true,
  smsUrgentOrdersEnabled: true,
  smsDailySummaryEnabled: false,
  seasonalAvailabilityControl: true,
  storeOpen: true,
  showOutOfSeasonProducts: false,
  autoToggleSeasonalProducts: true,
  storeOpensAt: '08:00',
  storeClosesAt: '22:00',
};

const loadSettings = (): AdminSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw =
      window.localStorage.getItem(ADMIN_SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_ADMIN_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AdminSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const createEmptyProductForm = (): Partial<Product> => ({
  ...DEFAULT_PRODUCT_FORM,
  images: [],
  variants: [{ ...DEFAULT_PRODUCT_VARIANT }],
});

const buildProductForm = (product: Product): Partial<Product> => {
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const primaryImage = product.image || images[0] || '';
  const normalizedImages = primaryImage
    ? [primaryImage, ...images.filter((image) => image !== primaryImage)]
    : images;

  return {
    ...product,
    image: primaryImage,
    images: normalizedImages,
    stock: product.stock || 999,
    variants: product.variants?.length ? product.variants : [{ ...DEFAULT_PRODUCT_VARIANT, price: product.pricePerKg }],
  };
};

export const AdminDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const localHost = isLocalDevHost();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'inSeason' | 'outOfSeason'>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('store');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCharge, setNewZoneCharge] = useState('');
  const [settingsForm, setSettingsForm] = useState<AdminSettings>(loadSettings);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState(localHost ? LOCAL_DEV_ADMIN_EMAIL : '');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminAuthenticating, setIsAdminAuthenticating] = useState(false);
  const [isLocalDevAuthenticated, setIsLocalDevAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(LOCAL_DEV_ADMIN_KEY) === 'true';
  });
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const productImagesInputRef = useRef<HTMLInputElement | null>(null);
  const hasAdminAccess = isAdmin || (localHost && isLocalDevAuthenticated);
  const isLocalDevBypass = isLocalDevAdminMode() && !isAdmin;
  
  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>(createEmptyProductForm);

  useEffect(() => {
    if (!settingsSavedMessage) return;
    const timeout = window.setTimeout(() => setSettingsSavedMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [settingsSavedMessage]);

  const loadAdminData = async () => {
    if (isLocalDevBypass) {
      setErrorMessage(null);
      setProducts(getLocalDevProducts());
      setOrders(getLocalDevOrders());
      setLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const [productsResult, ordersResult] = await Promise.all([
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsResult.error) {
        throw productsResult.error;
      }

      if (ordersResult.error) {
        throw ordersResult.error;
      }

      setProducts((productsResult.data ?? []).map(mapProductRow));
      setOrders((ordersResult.data ?? []).map(mapOrderRow));
    } catch (error) {
      console.error('Failed to load admin data', error);
      setErrorMessage('Failed to load admin data. Check Supabase tables, policies, and realtime settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAdminAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    void loadAdminData();

    const productsChannel = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void loadAdminData();
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadAdminData();
      })
      .subscribe();

    const refreshLocalOrders = () => {
      if (!isLocalDevBypass) return;
      setOrders(getLocalDevOrders());
    };
    window.addEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, refreshLocalOrders);

    return () => {
      void supabase.removeChannel(productsChannel);
      void supabase.removeChannel(ordersChannel);
      window.removeEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, refreshLocalOrders);
    };
  }, [hasAdminAccess, isLocalDevBypass]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (isLocalDevBypass) {
      setOrders((current) => {
        const nextOrders = current.map((order) => (order.id === orderId ? { ...order, status } : order));
        setLocalDevOrders(nextOrders);
        return nextOrders;
      });
      return;
    }

    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) {
        throw error;
      }
      await loadAdminData();
    } catch (error) {
      handleDatabaseError(error, OperationType.UPDATE, 'orders');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedVariants = (productForm.variants ?? [])
      .map((variant) => ({
        weight: variant.weight.trim(),
        price: Number(variant.price) || 0,
      }))
      .filter((variant) => variant.weight.length > 0);
    const finalVariants = sanitizedVariants.length > 0 ? sanitizedVariants : [{ ...DEFAULT_PRODUCT_VARIANT, price: Number(productForm.pricePerKg) || 0 }];
    const imageList = (productForm.images ?? []).filter(Boolean);
    const primaryImage = productForm.image || imageList[0] || '';
    const normalizedImages = primaryImage
      ? [primaryImage, ...imageList.filter((image) => image !== primaryImage)]
      : imageList;
    const sanitizedProductForm: Partial<Product> = {
      ...productForm,
      image: primaryImage,
      images: normalizedImages,
      stock: productForm.stock ?? 999,
      origin: productForm.origin || 'Rangpur',
      pricePerKg: finalVariants[0]?.price ?? (Number(productForm.pricePerKg) || 0),
      variants: finalVariants,
    };

    if (isLocalDevBypass) {
      const nextProduct: Product = {
        id: editingProduct?.id ?? `local-product-${Date.now()}`,
        name: sanitizedProductForm.name ?? '',
        description: sanitizedProductForm.description ?? '',
        image: sanitizedProductForm.image ?? '',
        images: sanitizedProductForm.images,
        pricePerKg: sanitizedProductForm.pricePerKg ?? 0,
        stock: sanitizedProductForm.stock ?? 999,
        variety: sanitizedProductForm.variety ?? 'Harivanga',
        origin: sanitizedProductForm.origin ?? 'Rangpur',
        tasteProfile: sanitizedProductForm.tasteProfile ?? '',
        isAvailable: sanitizedProductForm.isAvailable ?? true,
        variants: sanitizedProductForm.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }],
      };

      setProducts((current) =>
        {
          const nextProducts = editingProduct
            ? current.map((product) => (product.id === editingProduct.id ? nextProduct : product))
            : [...current, nextProduct];
          setLocalDevProducts(nextProducts);
          notifyStorefrontProductsChanged();
          return nextProducts;
        }
      );
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm(createEmptyProductForm());
      return;
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(mapProductToRow(sanitizedProductForm))
          .eq('id', editingProduct.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert(mapProductToRow(sanitizedProductForm));
        if (error) {
          throw error;
        }
      }
      await loadAdminData();
      notifyStorefrontProductsChanged();
      resetProductModal();
    } catch (error) {
      handleDatabaseError(error, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      if (isLocalDevBypass) {
        setProducts((current) => {
          const nextProducts = current.filter((product) => product.id !== id);
          setLocalDevProducts(nextProducts);
          notifyStorefrontProductsChanged();
          return nextProducts;
        });
        return;
      }

      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          throw error;
        }
        await loadAdminData();
        notifyStorefrontProductsChanged();
      } catch (error) {
        handleDatabaseError(error, OperationType.DELETE, 'products');
      }
    }
  };

  const handleSaveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    window.localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settingsForm));
    setSettingsSavedMessage('Settings saved');
  };

  const handleResetSettings = () => {
    if (!window.confirm('Reset settings to default values?')) return;
    window.localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSettingsForm(DEFAULT_SETTINGS);
    setNewZoneName('');
    setNewZoneCharge('');
    setSettingsSavedMessage('Settings reset');
  };

  const handleAddDeliveryZone = () => {
    const name = newZoneName.trim();
    const charge = Number(newZoneCharge);
    if (!name || Number.isNaN(charge)) return;
    setSettingsForm((current) => ({
      ...current,
      deliveryZoneEntries: [
        ...current.deliveryZoneEntries,
        { id: `zone-${Date.now()}`, name, charge },
      ],
    }));
    setNewZoneName('');
    setNewZoneCharge('');
  };

  const handleRemoveDeliveryZone = (zoneId: string) => {
    setSettingsForm((current) => ({
      ...current,
      deliveryZoneEntries: current.deliveryZoneEntries.filter((zone) => zone.id !== zoneId),
    }));
  };

  const handleAddAdminUser = () => {
    const name = window.prompt('Admin user name');
    if (!name) return;
    const email = window.prompt('Admin user email');
    if (!email) return;
    const roleInput = window.prompt('Role: Admin, Manager, or Staff', 'Staff');
    const role = roleInput === 'Admin' || roleInput === 'Manager' || roleInput === 'Staff' ? roleInput : 'Staff';
    setSettingsForm((current) => ({
      ...current,
      adminUserEntries: [...current.adminUserEntries, { id: `admin-${Date.now()}`, name, email, role }],
    }));
  };

  const handleSeedDatabase = async () => {
    const existingNames = new Set(products.map((product) => product.name.toLowerCase()));
    const missingProducts = MOCK_PRODUCTS.filter((product) => !existingNames.has(product.name.toLowerCase()));

    if (missingProducts.length === 0) {
      window.alert('All demo products are already available.');
      return;
    }

    try {
      if (isLocalDevBypass) {
        setProducts((current) => {
          const nextProducts = [...current, ...missingProducts];
          setLocalDevProducts(nextProducts);
          notifyStorefrontProductsChanged();
          return nextProducts;
        });
        window.alert(`Added ${missingProducts.length} demo product${missingProducts.length > 1 ? 's' : ''}.`);
        return;
      }

      for (const product of missingProducts) {
        const { id, ...data } = product;
        const { error } = await supabase.from('products').insert(mapProductToRow(data));
        if (error) {
          throw error;
        }
      }
      await loadAdminData();
      notifyStorefrontProductsChanged();
      window.alert(`Added ${missingProducts.length} demo product${missingProducts.length > 1 ? 's' : ''}.`);
    } catch (error) {
      handleDatabaseError(error, OperationType.WRITE, 'products');
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setSettingsForm((current) => ({ ...current, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []) as File[];
    if (files.length === 0) return;

    const images = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );

    setProductForm((current) => {
      const currentImages = current.images ?? (current.image ? [current.image] : []);
      const nextImages = [...currentImages, ...images].filter(Boolean);
      return {
        ...current,
        image: current.image || nextImages[0] || '',
        images: nextImages,
      };
    });

    event.target.value = '';
  };

  const handlePrimaryImageSelect = (image: string) => {
    setProductForm((current) => ({
      ...current,
      image,
      images: [image, ...(current.images ?? []).filter((item) => item !== image)],
    }));
  };

  const handleRemoveProductImage = (image: string) => {
    setProductForm((current) => {
      const nextImages = (current.images ?? []).filter((item) => item !== image);
      const nextPrimary = current.image === image ? nextImages[0] ?? '' : current.image ?? nextImages[0] ?? '';
      return {
        ...current,
        image: nextPrimary,
        images: nextImages,
      };
    });
  };

  const handleVariantChange = (index: number, key: keyof Product['variants'][number], value: string) => {
    setProductForm((current) => {
      const nextVariants = (current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }]).map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [key]: key === 'price' ? Number(value) || 0 : value,
            }
          : variant
      );

      return {
        ...current,
        variants: nextVariants,
        pricePerKg: nextVariants[0]?.price ?? current.pricePerKg ?? 0,
      };
    });
  };

  const handleAddVariant = () => {
    setProductForm((current) => ({
      ...current,
      variants: [...(current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }]), { weight: '', price: 0 }],
    }));
  };

  const handleRemoveVariant = (index: number) => {
    setProductForm((current) => {
      const currentVariants = current.variants ?? [{ ...DEFAULT_PRODUCT_VARIANT }];
      const nextVariants = currentVariants.length === 1
        ? [{ ...DEFAULT_PRODUCT_VARIANT }]
        : currentVariants.filter((_, variantIndex) => variantIndex !== index);

      return {
        ...current,
        variants: nextVariants,
        pricePerKg: nextVariants[0]?.price ?? 0,
      };
    });
  };

  const resetProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(createEmptyProductForm());
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminLoginError(null);

    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (localHost && normalizedEmail === LOCAL_DEV_ADMIN_EMAIL && adminPassword === LOCAL_DEV_ADMIN_PASSWORD) {
      window.localStorage.setItem(LOCAL_DEV_ADMIN_KEY, 'true');
      setLocalDevProducts(getLocalDevProducts());
      setIsLocalDevAuthenticated(true);
      setAdminPassword('');
      return;
    }

    setIsAdminAuthenticating(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: adminPassword,
      });

      if (error) {
        throw error;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (profileRow?.role !== 'admin') {
        await supabase.auth.signOut();
        setAdminLoginError('This account does not have admin access.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin authentication failed.';
      setAdminLoginError(message);
    } finally {
      setIsAdminAuthenticating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mango-orange"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Admin Data Error</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="text-mango-orange font-bold">Reload Page</button>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#0c1326] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-[28px] border border-white/8 bg-[#101933] p-3 shadow-[0_30px_120px_rgba(2,6,23,0.45)] sm:p-5"
          >
            <div className="rounded-[24px] border border-white/6 bg-[#11192f] px-4 py-6 sm:px-6 sm:py-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#7b2638] bg-[#2a1830] text-[#ff4d4f] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Lock size={24} strokeWidth={2.1} />
              </div>

              <div className="mt-4 text-center">
                <h1 className="text-[2rem] font-black tracking-tight text-white">Admin Portal</h1>
                <p className="mt-1.5 text-sm text-[#6f86b0]">Enter club management password</p>
              </div>

              <form onSubmit={handleAdminLogin} className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.24em] text-[#6d7ea5]">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="mt-2.5 h-12 w-full rounded-[14px] border border-[#ff4d4f] bg-[#dfe7f5] px-4 text-sm text-black outline-none transition placeholder:text-black/45 focus:border-[#ff6b6d] focus:ring-4 focus:ring-[#ff4d4f]/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.24em] text-[#6d7ea5]">
                    Master Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="mt-2.5 h-12 w-full rounded-[14px] border border-white/8 bg-[#dfe7f5] px-4 text-center text-sm font-bold tracking-[0.2em] text-black outline-none transition placeholder:text-black/35 focus:border-[#ff6b6d] focus:ring-4 focus:ring-[#ff4d4f]/10"
                  />
                </div>

                {adminLoginError && (
                  <div className="rounded-[18px] border border-[#ff4d4f]/25 bg-[#3a1d28] px-4 py-3 text-sm font-medium text-[#ffb7b8]">
                    {adminLoginError}
                  </div>
                )}

                {canUseDevelopmentFallbacks() && (
                  <div className="rounded-[16px] border border-[#7ea1ff]/20 bg-[#16213d] px-4 py-3 text-xs font-medium text-[#b8c7ea]">
                    Local test login: <span className="font-bold text-white">{LOCAL_DEV_ADMIN_EMAIL}</span> / <span className="font-bold text-white">{LOCAL_DEV_ADMIN_PASSWORD}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAdminAuthenticating}
                  className="flex h-14 w-full items-center justify-center rounded-[14px] border border-white/8 bg-[#202d45] text-lg font-black text-white transition hover:bg-[#25334f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isAdminAuthenticating ? 'Authenticating...' : 'Authenticate'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-4 w-full text-center text-xs font-semibold text-[#8da0c5] transition hover:text-white"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const activeTabLabel = activeTab === 'overview' ? 'Overview' : activeTab === 'products' ? 'Products' : activeTab === 'orders' ? 'Orders' : 'Settings';

  const chartData = orders.slice(0, 7).reverse().map(o => ({
    date: format(new Date(o.createdAt), 'MMM dd'),
    revenue: o.total
  }));

  const statusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#94a3b8' },
    { name: 'Confirmed', value: orders.filter(o => o.status === 'Confirmed').length, color: '#f5a623' },
    { name: 'Out for Delivery', value: orders.filter(o => o.status === 'Out for Delivery').length, color: '#3b82f6' },
    { name: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: '#10b981' },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'Cancelled').length, color: '#ef4444' },
  ];

  const recentOrders = orders.slice(0, 5);
  const attentionOrders = orders.filter((order) => order.status === 'Pending' || order.status === 'Cancelled').length;

  const filteredProducts = products.filter((product) => {
    const query = productSearchQuery.trim().toLowerCase();
    const matchesQuery = !query || product.name.toLowerCase().includes(query);
    const matchesStatus =
      productStatusFilter === 'all' ||
      (productStatusFilter === 'inSeason' && product.isAvailable) ||
      (productStatusFilter === 'outOfSeason' && !product.isAvailable);
    const matchesStock =
      productStockFilter === 'all' ||
      (productStockFilter === 'inStock' && product.stock > settingsForm.lowStockThreshold) ||
      (productStockFilter === 'lowStock' && product.stock > 0 && product.stock <= settingsForm.lowStockThreshold) ||
      (productStockFilter === 'outOfStock' && product.stock <= 0);

    return matchesQuery && matchesStatus && matchesStock;
  });

  const filteredOrders = orders.filter((order) => {
    const query = orderSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerPhone.toLowerCase().includes(query);
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    const matchesDate = !orderDateFilter || order.createdAt.startsWith(orderDateFilter);

    return matchesQuery && matchesStatus && matchesDate;
  });

  const formatCurrency = (value: number) => `\u09F3${value.toLocaleString()}`;
  const getOrderStatusClasses = (status: OrderStatus) => {
    if (status === 'Delivered') return 'bg-green-50 text-green-600';
    if (status === 'Out for Delivery') return 'bg-blue-50 text-blue-600';
    if (status === 'Confirmed') return 'bg-mango-yellow/10 text-mango-yellow';
    if (status === 'Cancelled') return 'bg-red-50 text-red-500';
    return 'bg-gray-50 text-gray-500';
  };
  const getStockClasses = (stock: number) => {
    if (stock <= 0) return 'bg-red-50 text-red-500';
    if (stock <= settingsForm.lowStockThreshold) return 'bg-amber-50 text-amber-600';
    return 'bg-green-50 text-green-600';
  };
  const getStockBarClasses = (stock: number) => {
    if (stock <= 0) return 'bg-red-500';
    if (stock <= settingsForm.lowStockThreshold) return 'bg-amber-400';
    return 'bg-green-500';
  };
  const updateSettings = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettingsForm((current) => ({ ...current, [key]: value }));
  };
  const toggleClasses = (enabled: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? 'bg-mango-orange' : 'bg-gray-200'}`;
  const toggleKnobClasses = (enabled: boolean) =>
    `inline-block h-5 w-5 transform rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-1'}`;
  const settingsTabs: Array<{ id: SettingsSection; label: string; icon: React.ElementType }> = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'availability', label: 'Availability', icon: CalendarDays },
  ];
  const panelTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
  const panelMotionProps = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: panelTransition,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={panelTransition}
      className="min-h-screen bg-gray-50 flex flex-col lg:flex-row"
    >
      {/* Sidebar */}
      <aside className="w-64 bg-mango-dark text-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="mb-12">
            <BrandLogo size="md" dark={false} />
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 transition-all"
            >
              <House size={20} /> Home
            </button>
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <LayoutDashboard size={20} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Package size={20} /> Products
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <ShoppingBag size={20} /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-mango-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <SettingsIcon size={20} /> Settings
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mango-orange rounded-full flex items-center justify-center font-bold">A</div>
            <div>
              <p className="text-sm font-bold">Harivanga.com Admin</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <div className="lg:hidden bg-mango-dark text-white px-4 py-5 sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-bold">Admin</p>
              <h1 className="text-2xl font-black">{activeTabLabel}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/15"
                aria-label="Go to home page"
              >
                <House size={18} />
              </button>
              <div className="text-right">
                <p className="text-xs text-white/50">Today</p>
                <p className="text-sm font-semibold">{format(new Date(), 'MMM dd')}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <Package size={18} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <ShoppingBag size={18} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-mango-orange text-white' : 'bg-white/5 text-white/70'}`}
            >
              <SettingsIcon size={18} />
              Settings
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-12">
          <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'overview' && (
          <motion.section key="overview" {...panelMotionProps} className="space-y-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Overview</h1>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                {canUseDevelopmentFallbacks() && (
                  <button 
                    onClick={handleSeedDatabase}
                    className="text-xs font-bold text-mango-orange hover:underline"
                  >
                    Seed Database
                  </button>
                )}
                <div className="text-sm text-gray-400 font-medium">{format(new Date(), 'PPPP')}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Orders Today</p>
                <h3 className="text-3xl font-black">{todayOrders.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Pending Orders</p>
                <h3 className="text-3xl font-black">{pendingOrders}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Revenue Today</p>
                <h3 className="text-3xl font-black">{formatCurrency(todayRevenue)}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Revenue</p>
                <h3 className="text-3xl font-black">{formatCurrency(totalRevenue)}</h3>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 sm:mb-8">Revenue Trend</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#ff6b35', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={4} dot={{ r: 6, fill: '#ff6b35', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 sm:mb-8">Order Status Distribution</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {statusData.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-500">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Recent Orders</h3>
                  <p className="text-sm text-gray-500 mt-1">Quick operations summary without extra clutter.</p>
                </div>
                <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-mango-orange">
                  {attentionOrders} require attention
                </div>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                    <div>
                      <p className="font-bold text-mango-dark">#{order.id.slice(-6).toUpperCase()} · {order.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.customerPhone} · {order.deliveryArea}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-mango-dark">{formatCurrency(order.total)}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: statusData.find((item) => item.name === order.status)?.color ?? '#6b7280' }}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === 'products' && (
          <motion.section key="products" {...panelMotionProps} className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Products</h1>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm(createEmptyProductForm());
                  setIsProductModalOpen(true);
                }}
                className="w-full sm:w-auto bg-mango-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-mango-orange/20"
              >
                <Plus size={20} /> Add New Product
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search by product name"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                />
              </div>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as 'all' | 'inSeason' | 'outOfSeason')}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              >
                <option value="all">All statuses</option>
                <option value="inSeason">In season</option>
                <option value="outOfSeason">Out of season</option>
              </select>
              <select
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value as 'all' | 'inStock' | 'lowStock' | 'outOfStock')}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              >
                <option value="all">All stock</option>
                <option value="inStock">Healthy stock</option>
                <option value="lowStock">Low stock</option>
                <option value="outOfStock">Out of stock</option>
              </select>
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Variety</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-mango-dark">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-gray-500">{product.variety}</td>
                      <td className="px-8 py-4 font-bold">{formatCurrency(product.pricePerKg)}</td>
                      <td className="px-8 py-4">
                        <div className="min-w-[180px]">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-mango-dark">{product.stock} kg</span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStockClasses(product.stock)}`}>
                              {product.stock <= 0 ? 'Out' : product.stock <= settingsForm.lowStockThreshold ? 'Low' : 'Healthy'}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className={`h-2 rounded-full ${getStockBarClasses(product.stock)}`}
                              style={{ width: `${Math.min((product.stock / Math.max(settingsForm.lowStockThreshold * 4, 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {product.isAvailable ? 'In Season' : 'Out of Season'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm(buildProductForm(product));
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-mango-orange transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-mango-dark truncate">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.variety}</p>
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {product.isAvailable ? 'In Season' : 'Out'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Price</p>
                          <p className="font-bold">{formatCurrency(product.pricePerKg)}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Stock</p>
                          <p className="font-bold">{product.stock} kg</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${getStockBarClasses(product.stock)}`}
                          style={{ width: `${Math.min((product.stock / Math.max(settingsForm.lowStockThreshold * 4, 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm(buildProductForm(product));
                            setIsProductModalOpen(true);
                          }}
                          className="flex-1 rounded-2xl bg-mango-orange/10 px-4 py-3 text-sm font-bold text-mango-orange"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                <p className="text-lg font-bold text-mango-dark">No matching products</p>
                <p className="mt-2 text-sm text-gray-500">Adjust your search or stock filters to find products faster.</p>
              </div>
            )}
          </motion.section>
        )}

        {activeTab === 'orders' && (
          <motion.section key="orders" {...panelMotionProps} className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Orders</h1>
                <p className="mt-2 text-sm text-gray-500">Track active deliveries, confirm new orders, and resolve exceptions quickly.</p>
              </div>
              <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-mango-orange">
                {attentionOrders} pending or cancelled
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_180px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by order ID, customer name, or phone"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                />
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value as 'all' | OrderStatus)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              />
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Items</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={`transition-colors hover:bg-gray-50/50 ${order.status === 'Pending' || order.status === 'Cancelled' ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className="mt-1 text-xs text-gray-400">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-mango-dark">{order.customerName}</span>
                          <span className="text-xs text-gray-400">{order.customerPhone}</span>
                          <span className="mt-1 text-xs text-gray-400">{order.deliveryAddress}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-sm text-gray-600">
                              <span className="font-semibold text-mango-dark">{item.quantity}x</span> {item.productName} ({item.variant})
                            </p>
                          ))}
                          {order.items.length > 2 && <p className="text-xs font-semibold text-gray-400">+{order.items.length - 2} more items</p>}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col text-sm text-gray-500">
                          <span className="font-semibold text-mango-dark">{order.deliveryArea}</span>
                          <span>{order.deliveryDate}</span>
                          <span>{order.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-bold">{formatCurrency(order.total)}</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getOrderStatusClasses(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="text-xs font-bold bg-gray-50 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-mango-orange/20 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredOrders.map((order) => (
                <div key={order.id} className={`rounded-3xl border border-gray-100 bg-white p-4 shadow-sm ${order.status === 'Pending' || order.status === 'Cancelled' ? 'ring-1 ring-orange-200' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order ID</p>
                      <p className="font-bold text-mango-dark">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-gray-400">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getOrderStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="font-bold text-mango-dark">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    <p className="mt-1 text-sm text-gray-500">{order.deliveryAddress}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Items</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
                          {item.quantity}x {item.productName} ({item.variant})
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-gray-50 px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Delivery</p>
                      <p className="mt-1 font-semibold text-mango-dark">{order.deliveryArea}</p>
                      <p className="text-xs text-gray-500">{order.deliveryDate}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment</p>
                      <p className="mt-1 font-semibold text-mango-dark">{order.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total</p>
                      <p className="text-lg font-black text-mango-dark">{formatCurrency(order.total)}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="max-w-[170px] rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-mango-orange/20"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                <p className="text-lg font-bold text-mango-dark">No orders found</p>
                <p className="mt-2 text-sm text-gray-500">Try a different search, status, or date filter.</p>
              </div>
            )}
          </motion.section>
        )}

        {activeTab === 'settings' && (
          <motion.section key="settings" {...panelMotionProps} className="overflow-hidden rounded-[28px] border border-gray-200 bg-[#faf8f5] shadow-sm">
            <div className="border-b border-[#e8e2d8] px-6 py-4 sm:px-8">
              <h1 className="text-[2rem] font-black leading-none text-[#2b2621]">Settings</h1>
              <p className="mt-2 text-sm text-[#7a7065]">Manage your store configuration</p>
            </div>

            <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-3">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeSettingsSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSettingsSection(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold shadow-sm transition ${
                        active
                          ? 'border-mango-orange bg-mango-orange text-white'
                          : 'border-[#e5ddd2] bg-white text-[#2b2621] hover:border-mango-orange/30'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

            <form id="admin-settings-form" onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="wait" initial={false}>
                {activeSettingsSection === 'store' && (
                <motion.div key="store" {...panelMotionProps} className="rounded-[24px] border border-[#e6ddd2] bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-[2rem] font-black leading-none text-[#201b16]">Store Information</h2>
                  <p className="mt-2 text-base text-[#8a7c6d]">Basic information about your store</p>
                  <div className="mt-7 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
                    <div>
                      <label className="text-[15px] font-semibold text-[#201b16]">Store Name</label>
                      <input value={settingsForm.storeName} onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                    </div>
                    <div>
                      <label className="text-[15px] font-semibold text-[#201b16]">Contact Email</label>
                      <input value={settingsForm.supportEmail} onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                    </div>
                    <div>
                      <label className="text-[15px] font-semibold text-[#201b16]">Contact Phone</label>
                      <input value={settingsForm.supportPhone} onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                    </div>
                    <div>
                      <label className="text-[15px] font-semibold text-[#201b16]">Website</label>
                      <input value={settingsForm.website} onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[15px] font-semibold text-[#201b16]">Address</label>
                      <textarea value={settingsForm.address} onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[15px] font-semibold text-[#201b16]">Store Logo</label>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fff2e8] text-mango-orange">
                          {settingsForm.logoUrl ? (
                            <img src={settingsForm.logoUrl} alt="Store logo preview" className="h-full w-full rounded-3xl object-cover" />
                          ) : (
                            <Store size={28} />
                          )}
                        </div>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="h-11 rounded-2xl border border-[#ddd3c6] bg-white px-5 text-sm font-semibold text-[#201b16] shadow-sm transition hover:border-mango-orange/30"
                        >
                          Upload New Logo
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'delivery' && (
                <motion.div key="delivery" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Delivery Configuration</h2>
                  <p className="mt-1 text-sm text-gray-500">Manage delivery zones, charges, and options</p>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="text-sm font-semibold text-mango-dark">Delivery Zones</label>
                      <div className="mt-4 space-y-3">
                        {settingsForm.deliveryZoneEntries.map((zone) => (
                          <div key={zone.id} className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                            <div className="font-medium text-mango-dark">{zone.name}</div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-500">{formatCurrency(zone.charge)}</span>
                              <button type="button" onClick={() => handleRemoveDeliveryZone(zone.id)} className="text-red-500 hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px_52px]">
                        <input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="Zone name" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                        <input value={newZoneCharge} onChange={(e) => setNewZoneCharge(e.target.value)} placeholder="Charge" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                        <button type="button" onClick={handleAddDeliveryZone} className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white text-mango-dark shadow-sm">
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-mango-dark">Default Delivery Time</label>
                        <input value={settingsForm.estimatedDeliveryTime} onChange={(e) => updateSettings('estimatedDeliveryTime', e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-mango-dark">Minimum Order Amount</label>
                        <input type="number" value={settingsForm.minimumOrderAmount} onChange={(e) => updateSettings('minimumOrderAmount', Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                      <div>
                        <p className="font-semibold text-mango-dark">Cash on Delivery (COD)</p>
                        <p className="text-sm text-gray-500">Allow customers to pay upon delivery</p>
                      </div>
                      <button type="button" onClick={() => updateSettings('codEnabled', !settingsForm.codEnabled)} className={toggleClasses(settingsForm.codEnabled)}>
                        <span className={toggleKnobClasses(settingsForm.codEnabled)} />
                      </button>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'payments' && (
                <motion.div key="payments" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Payment Methods</h2>
                  <p className="mt-1 text-sm text-gray-500">Configure accepted payment methods</p>
                  <div className="mt-6 space-y-4">
                    {[
                      { key: 'cashPaymentEnabled' as const, title: 'Cash Payment', desc: 'Accept cash on delivery', tone: 'bg-green-100 text-green-600' },
                      { key: 'mobilePaymentEnabled' as const, title: 'Mobile Payment', desc: 'Accept mobile wallet payments', tone: 'bg-blue-100 text-blue-600' },
                      { key: 'cardPaymentEnabled' as const, title: 'Credit/Debit Cards', desc: 'Accept card payments online', tone: 'bg-purple-100 text-purple-600' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                            <Wallet size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-mango-dark">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => updateSettings(item.key, !settingsForm[item.key])} className={toggleClasses(settingsForm[item.key])}>
                          <span className={toggleKnobClasses(settingsForm[item.key])} />
                        </button>
                      </div>
                    ))}
                    <textarea value={settingsForm.mobilePaymentSettings} onChange={(e) => updateSettings('mobilePaymentSettings', e.target.value)} rows={3} placeholder="Mobile payment settings" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                    <textarea value={settingsForm.bankSettings} onChange={(e) => updateSettings('bankSettings', e.target.value)} rows={3} placeholder="Bank settings" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'inventory' && (
                <motion.div key="inventory" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Inventory Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">Configure stock alerts and inventory rules</p>
                  <div className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-mango-dark">Low Stock Alert Threshold</label>
                        <input type="number" min={0} value={settingsForm.lowStockThreshold} onChange={(e) => updateSettings('lowStockThreshold', Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                        <p className="mt-2 text-xs text-gray-500">Get notified when stock falls below this number</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-mango-dark">Out of Stock Behavior</label>
                        <select value={settingsForm.outOfStockBehavior} onChange={(e) => updateSettings('outOfStockBehavior', e.target.value as AdminSettings['outOfStockBehavior'])} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20">
                          <option value="Hide products">Hide from store</option>
                          <option value="Mark out of stock">Mark out of stock</option>
                          <option value="Allow backorders">Allow backorders</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                      <div>
                        <p className="font-semibold text-mango-dark">Auto-disable Low Stock Items</p>
                        <p className="text-sm text-gray-500">Automatically disable products when stock is low</p>
                      </div>
                      <button type="button" onClick={() => updateSettings('autoDisableLowStockItems', !settingsForm.autoDisableLowStockItems)} className={toggleClasses(settingsForm.autoDisableLowStockItems)}>
                        <span className={toggleKnobClasses(settingsForm.autoDisableLowStockItems)} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                      <div>
                        <p className="font-semibold text-mango-dark">Track Inventory</p>
                        <p className="text-sm text-gray-500">Enable inventory tracking for all products</p>
                      </div>
                      <button type="button" onClick={() => updateSettings('trackInventory', !settingsForm.trackInventory)} className={toggleClasses(settingsForm.trackInventory)}>
                        <span className={toggleKnobClasses(settingsForm.trackInventory)} />
                      </button>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'orders' && (
                <motion.div key="orders-settings" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Order Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">Configure order processing rules</p>
                  <div className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-mango-dark">Default Order Status</label>
                        <select value={settingsForm.defaultOrderStatus} onChange={(e) => updateSettings('defaultOrderStatus', e.target.value as OrderStatus)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20">
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-mango-dark">Cancellation Window (minutes)</label>
                        <input type="number" min={0} value={settingsForm.cancellationWindowMinutes} onChange={(e) => updateSettings('cancellationWindowMinutes', Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                      <div>
                        <p className="font-semibold text-mango-dark">Allow Customer Cancellation</p>
                        <p className="text-sm text-gray-500">Let customers cancel within the cancellation window</p>
                      </div>
                      <button type="button" onClick={() => updateSettings('allowCustomerCancellation', !settingsForm.allowCustomerCancellation)} className={toggleClasses(settingsForm.allowCustomerCancellation)}>
                        <span className={toggleKnobClasses(settingsForm.allowCustomerCancellation)} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                      <div>
                        <p className="font-semibold text-mango-dark">Auto-confirm Orders</p>
                        <p className="text-sm text-gray-500">Automatically confirm orders after payment</p>
                      </div>
                      <button type="button" onClick={() => updateSettings('autoConfirmOrders', !settingsForm.autoConfirmOrders)} className={toggleClasses(settingsForm.autoConfirmOrders)}>
                        <span className={toggleKnobClasses(settingsForm.autoConfirmOrders)} />
                      </button>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'users' && (
                <motion.div key="users" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Users</h2>
                  <p className="mt-1 text-sm text-gray-500">Manage admin users and roles</p>
                  <div className="mt-5 grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                      {settingsForm.adminUserEntries.map((adminUser) => (
                        <div key={adminUser.id} className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 font-semibold text-mango-orange">
                              {adminUser.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-mango-dark">{adminUser.name}</p>
                              <p className="text-sm text-gray-500">{adminUser.email}</p>
                            </div>
                          </div>
                          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-mango-dark">{adminUser.role}</span>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddAdminUser} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-mango-dark shadow-sm">
                        <Plus size={18} />
                        Add New User
                      </button>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'notifications' && (
                <motion.div key="notifications" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Notifications</h2>
                  <p className="mt-1 text-sm text-gray-500">Configure email and SMS notifications</p>
                  <div className="mt-5 grid grid-cols-1 gap-4">
                    <div className="space-y-6">
                      <div>
                        <p className="mb-4 text-sm font-semibold text-mango-dark">Email Notifications</p>
                        <div className="space-y-3">
                          {[
                            { key: 'emailNewOrderEnabled' as const, title: 'New Order', desc: 'Receive email when a new order is placed' },
                            { key: 'emailOrderStatusEnabled' as const, title: 'Order Status Update', desc: 'Receive email when order status changes' },
                            { key: 'emailLowStockEnabled' as const, title: 'Low Stock Alert', desc: 'Receive email when product stock is low' },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                              <div>
                                <p className="font-semibold text-mango-dark">{item.title}</p>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                              </div>
                              <button type="button" onClick={() => updateSettings(item.key, !settingsForm[item.key])} className={toggleClasses(settingsForm[item.key])}>
                                <span className={toggleKnobClasses(settingsForm[item.key])} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-4 text-sm font-semibold text-mango-dark">SMS Notifications</p>
                        <div className="space-y-3">
                          {[
                            { key: 'smsUrgentOrdersEnabled' as const, title: 'Urgent Orders', desc: 'Receive SMS for orders needing immediate attention' },
                            { key: 'smsDailySummaryEnabled' as const, title: 'Daily Summary', desc: 'Receive daily order summary via SMS' },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                              <div>
                                <p className="font-semibold text-mango-dark">{item.title}</p>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                              </div>
                              <button type="button" onClick={() => updateSettings(item.key, !settingsForm[item.key])} className={toggleClasses(settingsForm[item.key])}>
                                <span className={toggleKnobClasses(settingsForm[item.key])} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeSettingsSection === 'availability' && (
                <motion.div key="availability" {...panelMotionProps} className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                  <h2 className="text-2xl font-black text-mango-dark">Availability</h2>
                  <p className="mt-1 text-sm text-gray-500">Manage product visibility and seasonal settings</p>
                  <div className="mt-5 grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                      {[
                        { key: 'storeOpen' as const, title: 'Store Open', desc: 'Toggle store availability for customers' },
                        { key: 'showOutOfSeasonProducts' as const, title: 'Show Out of Season Products', desc: 'Display products marked as out of season' },
                        { key: 'autoToggleSeasonalProducts' as const, title: 'Auto-toggle Seasonal Products', desc: 'Automatically enable/disable based on season dates' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-3xl bg-[#f8f7f5] px-4 py-4">
                          <div>
                            <p className="font-semibold text-mango-dark">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <button type="button" onClick={() => updateSettings(item.key, !settingsForm[item.key])} className={toggleClasses(settingsForm[item.key])}>
                            <span className={toggleKnobClasses(settingsForm[item.key])} />
                          </button>
                        </div>
                      ))}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-semibold text-mango-dark">Store Opens</label>
                          <input type="time" value={settingsForm.storeOpensAt} onChange={(e) => updateSettings('storeOpensAt', e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-mango-dark">Store Closes</label>
                          <input type="time" value={settingsForm.storeClosesAt} onChange={(e) => updateSettings('storeClosesAt', e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}
                </AnimatePresence>

                <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${activeSettingsSection === 'store' ? 'sm:justify-start' : 'sm:justify-between'}`}>
                  <div className={`flex flex-wrap items-center gap-3 ${activeSettingsSection === 'store' ? 'hidden' : 'flex'}`}>
                    {settingsSavedMessage && (
                      <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-600">
                        {settingsSavedMessage}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-500 transition hover:border-red-200 hover:text-red-500"
                    >
                      Reset Defaults
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="rounded-2xl bg-mango-orange px-6 py-3 text-sm font-bold text-white shadow-xl shadow-mango-orange/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
          </motion.section>
        )}
          </AnimatePresence>
        </div>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-mango-dark/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
            >
              <div className="p-5 sm:p-8 border-b border-gray-100 flex justify-between items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-black">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={resetProductModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-5 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Name</label>
                    <input
                      required
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Variety</label>
                    <select
                      value={productForm.variety}
                      onChange={(e) => setProductForm({ ...productForm, variety: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    >
                      <option>Harivanga</option>
                      <option>Himsagar</option>
                      <option>Langra</option>
                      <option>Alphonso</option>
                      <option>Amrapali</option>
                      <option>Fazli</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Taste Profile</label>
                  <input
                    required
                    type="text"
                    value={productForm.tasteProfile}
                    onChange={(e) => setProductForm({ ...productForm, tasteProfile: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    placeholder="Sweet, aromatic, creamy..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Origin</label>
                    <select
                      value={productForm.origin}
                      onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    >
                      {PRODUCT_ORIGINS.map((origin) => (
                        <option key={origin} value={origin}>{origin}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Season Status</label>
                    <select
                      value={productForm.isAvailable ? 'in-season' : 'out-of-season'}
                      onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.value === 'in-season' })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    >
                      <option value="in-season">In Season</option>
                      <option value="out-of-season">Out of Season</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price Options</label>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark"
                    >
                      <Plus size={14} />
                      Add Price
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(productForm.variants ?? []).map((variant, index) => (
                      <div key={`${variant.weight}-${index}`} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[minmax(0,1fr)_180px_52px]">
                        <input
                          required
                          type="text"
                          value={variant.weight}
                          onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                          placeholder="Weight label, e.g. 1kg or 5kg Box"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                        />
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={variant.price === 0 ? '' : String(variant.price)}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="Price"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">The first option becomes the starting price shown on Home and Shop.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Images</label>
                    <button
                      type="button"
                      onClick={() => productImagesInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark"
                    >
                      <ImageIcon size={14} />
                      Upload Images
                    </button>
                    <input
                      ref={productImagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </div>

                  {(productForm.images ?? []).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {(productForm.images ?? []).map((image, index) => {
                        const isPrimary = productForm.image === image;
                        return (
                          <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                            <div className="aspect-square overflow-hidden bg-gray-100">
                              <img src={image} alt={`Product upload ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex items-center gap-2 p-3">
                              <button
                                type="button"
                                onClick={() => handlePrimaryImageSelect(image)}
                                className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${isPrimary ? 'bg-mango-orange text-white' : 'bg-gray-100 text-mango-dark'}`}
                              >
                                {isPrimary ? 'Primary' : 'Set Primary'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveProductImage(image)}
                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      Upload one or more images from your device. Choose one as the primary image for Home and Shop.
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-4">
                  <button
                    type="button"
                    onClick={resetProductModal}
                    className="flex-grow py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow bg-mango-orange text-white py-4 rounded-2xl font-bold shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
