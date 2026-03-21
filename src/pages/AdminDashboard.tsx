import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleDatabaseError, mapOrderRow, mapProductRow, mapProductToRow, OperationType, supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus } from '../types';
import { getLocalDevProducts, getMockProducts, isLocalDevAdminMode, isLocalDevHost, LOCAL_DEV_ADMIN_KEY, setLocalDevProducts } from '../lib/localDevProducts';
import { getLocalDevOrders, LOCAL_DEV_ORDERS_UPDATED_EVENT, setLocalDevOrders } from '../lib/localDevOrders';
import { notifyStorefrontProductsChanged } from '../lib/storefrontSync';
import { optimizeProductUpload } from '../lib/imageOptimization';
import { getThumbnailImageSrc } from '../lib/imageSources';
import { BrandLogo } from '../components/BrandLogo';
import { formatLongDate, formatOrderTimestamp, formatShortMonthDay } from '../lib/dates';
import { 
  LayoutDashboard, Package, ShoppingBag, TrendingUp, 
  Plus, Edit2, Trash2,
  Search, Settings as SettingsIcon, House, Lock
} from 'lucide-react';
import { canUseDevelopmentFallbacks } from '../lib/env';

const AdminProductModal = lazy(() =>
  import('../components/admin/AdminProductModal').then((module) => ({ default: module.AdminProductModal }))
);
const AdminSettingsPanel = lazy(() =>
  import('../components/admin/AdminSettingsPanel').then((module) => ({ default: module.AdminSettingsPanel }))
);

const LOCAL_DEV_ADMIN_EMAIL = 'admin@local';
const LOCAL_DEV_ADMIN_PASSWORD = 'admin1234';
type AdminTab = 'overview' | 'products' | 'orders' | 'settings';
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
  promoVideoUrl: string;
  promoDescription: string;
};

const ADMIN_SETTINGS_KEY = 'harivanga_admin_settings';
const LEGACY_ADMIN_SETTINGS_KEY = 'mangobd_admin_settings';
const PRODUCTS_PAGE_SIZE = 12;
const ORDERS_PAGE_SIZE = 10;
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
  promoVideoUrl: '',
  promoDescription: '',
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
  const [overviewOrders, setOverviewOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [productTotalCount, setProductTotalCount] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalCount, setOrderTotalCount] = useState(0);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'inSeason' | 'outOfSeason'>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');
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
  const productImagesInputRef = useRef<HTMLInputElement | null>(null);
  const hasAdminAccess = isAdmin || (localHost && isLocalDevAuthenticated);
  const isLocalDevBypass = isLocalDevAdminMode() && !isAdmin;
  
  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>(createEmptyProductForm);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSubmitError, setProductSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsSavedMessage) return;
    const timeout = window.setTimeout(() => setSettingsSavedMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [settingsSavedMessage]);

  const loadOverviewData = async () => {
    if (isLocalDevBypass) {
      setOverviewOrders(getLocalDevOrders());
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id,customer_name,customer_phone,delivery_area,total,status,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setOverviewOrders((data ?? []).map(mapOrderRow));
  };

  const loadProductsPage = async () => {
    if (isLocalDevBypass) {
      const query = productSearchQuery.trim().toLowerCase();
      const allProducts = (await getLocalDevProducts()).filter((product) => {
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

      setProductTotalCount(allProducts.length);
      const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
      setProducts(allProducts.slice(start, start + PRODUCTS_PAGE_SIZE));
      return;
    }

    const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    const trimmedQuery = productSearchQuery.trim();
    if (trimmedQuery) {
      query = query.ilike('name', `%${trimmedQuery}%`);
    }

    if (productStatusFilter === 'inSeason') {
      query = query.eq('is_available', true);
    } else if (productStatusFilter === 'outOfSeason') {
      query = query.eq('is_available', false);
    }

    if (productStockFilter === 'inStock') {
      query = query.gt('stock', settingsForm.lowStockThreshold);
    } else if (productStockFilter === 'lowStock') {
      query = query.gt('stock', 0).lte('stock', settingsForm.lowStockThreshold);
    } else if (productStockFilter === 'outOfStock') {
      query = query.lte('stock', 0);
    }

    const { data, error, count } = await query.range(start, start + PRODUCTS_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    setProducts((data ?? []).map(mapProductRow));
    setProductTotalCount(count ?? 0);
  };

  const loadOrdersPage = async () => {
    if (isLocalDevBypass) {
      const query = orderSearchQuery.trim().toLowerCase();
      const allOrders = getLocalDevOrders().filter((order) => {
        const matchesQuery =
          !query ||
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerPhone.toLowerCase().includes(query);
        const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
        const matchesDate = !orderDateFilter || order.createdAt.startsWith(orderDateFilter);

        return matchesQuery && matchesStatus && matchesDate;
      });

      setOrderTotalCount(allOrders.length);
      const start = (orderPage - 1) * ORDERS_PAGE_SIZE;
      setOrders(allOrders.slice(start, start + ORDERS_PAGE_SIZE));
      return;
    }

    const start = (orderPage - 1) * ORDERS_PAGE_SIZE;
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    const trimmedQuery = orderSearchQuery.trim();
    if (trimmedQuery) {
      if (/^[0-9a-f-]{32,36}$/i.test(trimmedQuery)) {
        query = query.eq('id', trimmedQuery);
      } else {
        query = query.or(`customer_name.ilike.%${trimmedQuery}%,customer_phone.ilike.%${trimmedQuery}%`);
      }
    }

    if (orderStatusFilter !== 'all') {
      query = query.eq('status', orderStatusFilter);
    }

    if (orderDateFilter) {
      const nextDate = new Date(`${orderDateFilter}T00:00:00`);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateIso = nextDate.toISOString().slice(0, 10);
      query = query.gte('created_at', `${orderDateFilter}T00:00:00`).lt('created_at', `${nextDateIso}T00:00:00`);
    }

    const { data, error, count } = await query.range(start, start + ORDERS_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    setOrders((data ?? []).map(mapOrderRow));
    setOrderTotalCount(count ?? 0);
  };

  useEffect(() => {
    if (!hasAdminAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    void loadOverviewData()
      .catch((error) => {
        console.error('Failed to load admin overview', error);
        setErrorMessage('Failed to load admin data. Check Supabase tables, policies, and realtime settings.');
      })
      .finally(() => setLoading(false));
  }, [hasAdminAccess]);

  useEffect(() => {
    if (!hasAdminAccess || activeTab === 'overview' || activeTab === 'settings') {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    void (activeTab === 'products' ? loadProductsPage() : loadOrdersPage())
      .catch((error) => {
        console.error(`Failed to load admin ${activeTab}`, error);
        setErrorMessage('Failed to load admin data. Check Supabase tables, policies, and realtime settings.');
      })
      .finally(() => setLoading(false));
  }, [
    activeTab,
    hasAdminAccess,
    orderDateFilter,
    orderPage,
    orderSearchQuery,
    orderStatusFilter,
    productPage,
    productSearchQuery,
    productStatusFilter,
    productStockFilter,
    settingsForm.lowStockThreshold,
  ]);

  useEffect(() => {
    if (!hasAdminAccess) {
      return;
    }

    const productsChannel = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (activeTab !== 'products') {
          return;
        }

        void loadProductsPage().catch((error) => {
          console.error('Failed to refresh admin products', error);
        });
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOverviewData().catch((error) => {
          console.error('Failed to refresh admin overview', error);
        });

        if (activeTab === 'orders') {
          void loadOrdersPage().catch((error) => {
            console.error('Failed to refresh admin orders', error);
          });
        }
      })
      .subscribe();

    const refreshLocalOrders = () => {
      if (!isLocalDevBypass) return;
      const nextOrders = getLocalDevOrders();
      setOverviewOrders(nextOrders);
      setOrders(nextOrders.slice(0, ORDERS_PAGE_SIZE));
      setOrderTotalCount(nextOrders.length);
    };
    window.addEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, refreshLocalOrders);

    return () => {
      void supabase.removeChannel(productsChannel);
      void supabase.removeChannel(ordersChannel);
      window.removeEventListener(LOCAL_DEV_ORDERS_UPDATED_EVENT, refreshLocalOrders);
    };
  }, [
    activeTab,
    hasAdminAccess,
    isLocalDevBypass,
    orderDateFilter,
    orderPage,
    orderSearchQuery,
    orderStatusFilter,
    productPage,
    productSearchQuery,
    productStatusFilter,
    productStockFilter,
    settingsForm.lowStockThreshold,
  ]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearchQuery, productStatusFilter, productStockFilter]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearchQuery, orderStatusFilter, orderDateFilter]);

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
      await Promise.all([loadOverviewData(), loadOrdersPage()]);
    } catch (error) {
      handleDatabaseError(error, OperationType.UPDATE, 'orders');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) {
      return;
    }

    setIsSavingProduct(true);
    setProductSubmitError(null);
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
      const allExistingProducts = await getLocalDevProducts();
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

      const nextProducts = editingProduct
        ? allExistingProducts.map((product) => (product.id === editingProduct.id ? nextProduct : product))
        : [...allExistingProducts, nextProduct];

      setLocalDevProducts(nextProducts);
      notifyStorefrontProductsChanged();
      await loadProductsPage();
      resetProductModal();
      setIsSavingProduct(false);
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
      await loadProductsPage();
      notifyStorefrontProductsChanged();
      resetProductModal();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Could not save the product.';
      setProductSubmitError(nextMessage);
      handleDatabaseError(error, OperationType.WRITE, 'products');
    } finally {
      setIsSavingProduct(false);
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
        await loadProductsPage();
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
    setSettingsSavedMessage('Settings reset');
  };

  const handleSeedDatabase = async () => {
    let existingNames = new Set(products.map((product) => product.name.toLowerCase()));

    try {
      if (isLocalDevBypass) {
        const mockProducts = await getMockProducts();
        const missingProducts = mockProducts.filter((product) => !existingNames.has(product.name.toLowerCase()));
        if (missingProducts.length === 0) {
          window.alert('All demo products are already available.');
          return;
        }

        setProducts((current) => {
          const nextProducts = [...current, ...missingProducts];
          setLocalDevProducts(nextProducts);
          notifyStorefrontProductsChanged();
          return nextProducts;
        });
        window.alert(`Added ${missingProducts.length} demo product${missingProducts.length > 1 ? 's' : ''}.`);
        return;
      }

      const { data: existingRows, error: existingError } = await supabase.from('products').select('name');
      if (existingError) {
        throw existingError;
      }
      existingNames = new Set((existingRows ?? []).map((row) => row.name.toLowerCase()));

      const mockProducts = await getMockProducts();
      const missingProducts = mockProducts.filter((product) => !existingNames.has(product.name.toLowerCase()));
      if (missingProducts.length === 0) {
        window.alert('All demo products are already available.');
        return;
      }

      for (const product of missingProducts) {
        const { id, ...data } = product;
        const { error } = await supabase.from('products').insert(mapProductToRow(data));
        if (error) {
          throw error;
        }
      }
      await loadProductsPage();
      notifyStorefrontProductsChanged();
      window.alert(`Added ${missingProducts.length} demo product${missingProducts.length > 1 ? 's' : ''}.`);
    } catch (error) {
      handleDatabaseError(error, OperationType.WRITE, 'products');
    }
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []) as File[];
    if (files.length === 0) return;

    const images = await Promise.all(files.map((file) => optimizeProductUpload(file)));

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
    setProductSubmitError(null);
    setIsSavingProduct(false);
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminLoginError(null);

    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (localHost && normalizedEmail === LOCAL_DEV_ADMIN_EMAIL && adminPassword === LOCAL_DEV_ADMIN_PASSWORD) {
      window.localStorage.setItem(LOCAL_DEV_ADMIN_KEY, 'true');
      setLocalDevProducts(await getLocalDevProducts());
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
          <div className="w-full rounded-[28px] border border-white/8 bg-[#101933] p-3 shadow-[0_30px_120px_rgba(2,6,23,0.45)] sm:p-5">
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
          </div>
        </div>
      </div>
    );
  }

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = overviewOrders.filter(o => o.createdAt.startsWith(today));
  const totalOrders = overviewOrders.length;
  const totalRevenue = overviewOrders.reduce((acc, o) => acc + o.total, 0);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const activeTabLabel = activeTab === 'overview' ? 'Overview' : activeTab === 'products' ? 'Products' : activeTab === 'orders' ? 'Orders' : 'Settings';

  const recentOrders = overviewOrders.slice(0, 5);
  const attentionOrders = overviewOrders.filter((order) => order.status === 'Pending' || order.status === 'Cancelled').length;
  const productTotalPages = Math.max(1, Math.ceil(productTotalCount / PRODUCTS_PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(orderTotalCount / ORDERS_PAGE_SIZE));

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
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
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
                <p className="text-sm font-semibold">{formatShortMonthDay(new Date())}</p>
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
        {activeTab === 'overview' && (
          <section className="space-y-8">
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
                <div className="text-sm text-gray-400 font-medium">{formatLongDate(new Date())}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-sm font-medium text-gray-400">Today's Orders</p>
                <h3 className="mt-2 text-3xl font-black text-mango-dark">{todayOrders.length}</h3>
              </div>
              <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Package size={24} />
                </div>
                <p className="text-sm font-medium text-gray-400">Total Orders</p>
                <h3 className="mt-2 text-3xl font-black text-mango-dark">{totalOrders}</h3>
              </div>
              <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm font-medium text-gray-400">Today's Revenue</p>
                <h3 className="mt-2 text-3xl font-black text-mango-dark">{formatCurrency(todayRevenue)}</h3>
              </div>
              <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                <h3 className="mt-2 text-3xl font-black text-mango-dark">{formatCurrency(totalRevenue)}</h3>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Recent Orders</h3>
                  <p className="mt-1 text-sm text-gray-500">Latest orders with the key details only.</p>
                </div>
                <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-mango-orange">
                  {attentionOrders} require attention
                </div>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-3 rounded-2xl bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-mango-dark">#{order.id.slice(-6).toUpperCase()} · {order.customerName}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatOrderTimestamp(new Date(order.createdAt))}</p>
                      <p className="mt-1 text-xs text-gray-500">Phone: {order.customerPhone}</p>
                      <p className="mt-1 text-xs text-gray-500">Address: {order.deliveryAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-mango-dark">{formatCurrency(order.total)}</p>
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Out for Delivery' ? 'text-blue-600' : order.status === 'Confirmed' ? 'text-mango-yellow' : order.status === 'Cancelled' ? 'text-red-500' : 'text-gray-500'}`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {recentOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
                  <p className="text-base font-bold text-mango-dark">No orders yet</p>
                  <p className="mt-2 text-sm text-gray-500">New orders will appear here once customers start checking out.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'products' && (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-black text-mango-dark">Products</h1>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm(createEmptyProductForm());
                  setProductSubmitError(null);
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
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={getThumbnailImageSrc(product.image)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              width={96}
                              height={96}
                            />
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
                              setProductSubmitError(null);
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
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={getThumbnailImageSrc(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={160}
                        height={160}
                      />
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
                            setProductSubmitError(null);
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

            {products.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                <p className="text-lg font-bold text-mango-dark">No matching products</p>
                <p className="mt-2 text-sm text-gray-500">Adjust your search or stock filters to find products faster.</p>
              </div>
            )}
            {productTotalCount > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(productPage - 1) * PRODUCTS_PAGE_SIZE + 1}-{Math.min(productPage * PRODUCTS_PAGE_SIZE, productTotalCount)} of {productTotalCount} products
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((current) => Math.max(1, current - 1))}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-mango-dark">Page {productPage} / {productTotalPages}</span>
                  <button
                    type="button"
                    disabled={productPage >= productTotalPages}
                    onClick={() => setProductPage((current) => Math.min(productTotalPages, current + 1))}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="space-y-8">
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
                  {orders.map((order) => (
                    <tr key={order.id} className={`transition-colors hover:bg-gray-50/50 ${order.status === 'Pending' || order.status === 'Cancelled' ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className="mt-1 text-xs text-gray-400">{formatOrderTimestamp(new Date(order.createdAt))}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-mango-dark">Name: {order.customerName}</span>
                          <span className="text-xs text-gray-400">Phone: {order.customerPhone}</span>
                          <span className="mt-1 text-xs text-gray-400">Address: {order.deliveryAddress}</span>
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
              {orders.map((order) => (
                <div key={order.id} className={`rounded-3xl border border-gray-100 bg-white p-4 shadow-sm ${order.status === 'Pending' || order.status === 'Cancelled' ? 'ring-1 ring-orange-200' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order ID</p>
                      <p className="font-bold text-mango-dark">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatOrderTimestamp(new Date(order.createdAt))}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getOrderStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="font-bold text-mango-dark">Name: {order.customerName}</p>
                    <p className="text-sm text-gray-500">Phone: {order.customerPhone}</p>
                    <p className="mt-1 text-sm text-gray-500">Address: {order.deliveryAddress}</p>
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

            {orders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                <p className="text-lg font-bold text-mango-dark">No orders found</p>
                <p className="mt-2 text-sm text-gray-500">Try a different search, status, or date filter.</p>
              </div>
            )}
            {orderTotalCount > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(orderPage - 1) * ORDERS_PAGE_SIZE + 1}-{Math.min(orderPage * ORDERS_PAGE_SIZE, orderTotalCount)} of {orderTotalCount} orders
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-mango-dark">Page {orderPage} / {orderTotalPages}</span>
                  <button
                    type="button"
                    disabled={orderPage >= orderTotalPages}
                    onClick={() => setOrderPage((current) => Math.min(orderTotalPages, current + 1))}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'settings' && (
          <Suspense fallback={<div className="rounded-3xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Loading settings...</div>}>
            <AdminSettingsPanel
              promoVideoUrl={settingsForm.promoVideoUrl}
              promoDescription={settingsForm.promoDescription}
              savedMessage={settingsSavedMessage}
              onPromoVideoUrlChange={(value) => setSettingsForm({ ...settingsForm, promoVideoUrl: value })}
              onPromoDescriptionChange={(value) => setSettingsForm({ ...settingsForm, promoDescription: value })}
              onReset={handleResetSettings}
              onSubmit={handleSaveSettings}
            />
          </Suspense>
        )}
        </div>
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-mango-dark/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-mango-orange" />
              <p className="mt-4 text-sm font-bold text-mango-dark">Loading product form...</p>
            </div>
          </div>
        }>
          <AdminProductModal
            editingProduct={editingProduct}
            productForm={productForm}
            productOrigins={PRODUCT_ORIGINS}
            productImagesInputRef={productImagesInputRef}
            isSubmitting={isSavingProduct}
            submitError={productSubmitError}
            onClose={resetProductModal}
            onSubmit={handleSaveProduct}
            onChange={setProductForm}
            onVariantChange={handleVariantChange}
            onAddVariant={handleAddVariant}
            onRemoveVariant={handleRemoveVariant}
            onProductImageUpload={handleProductImageUpload}
            onPrimaryImageSelect={handlePrimaryImageSelect}
            onRemoveProductImage={handleRemoveProductImage}
          />
        </Suspense>
        )}
    </div>
  );
};
