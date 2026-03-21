import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapOrderToRow, supabase } from '../supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { hasSupabaseConfig } from '../lib/env';
import { canUseLocalOrderFallback, saveLocalDevOrder } from '../lib/localDevOrders';
import { CheckCircle2, CreditCard, Truck, MapPin, Phone, User as UserIcon, Building2, LocateFixed } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { getThumbnailImageSrc } from '../lib/imageSources';
import { saveRecentOrder } from '../lib/recentOrders';

const DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Barishal: ['Barguna', 'Barishal', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur'],
  Chattogram: ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  Dhaka: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  Khulna: ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  Rajshahi: ['Bogura', 'Joypurhat', 'Naogaon', 'Natore', 'Chapai Nawabganj', 'Pabna', 'Rajshahi', 'Sirajganj'],
  Rangpur: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
};

type DeliveryMethod = 'Home Delivery' | 'Courier Pickup';

const normalizePhoneNumber = (phone: string) => phone.replace(/\D/g, '');

export const Checkout: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.savedAddresses[0] || '',
    division: 'Dhaka',
    district: 'Dhaka',
    deliveryMethod: 'Home Delivery' as DeliveryMethod,
    paymentMethod: 'Cash on Delivery' as 'bKash' | 'Nagad' | 'Cash on Delivery',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    setFormData((current) => ({
      ...current,
      name: current.name || profile.name || '',
      phone: current.phone || profile.phone || '',
      address: current.address || profile.savedAddresses[0] || '',
    }));
  }, [profile]);

  const divisionOptions = Object.keys(DISTRICTS_BY_DIVISION);
  const districtOptions = DISTRICTS_BY_DIVISION[formData.division];
  const deliveryCharge = formData.deliveryMethod === 'Home Delivery' ? 60 : 120;

  const deliveryAreaLabel = useMemo(
    () => `${formData.division} / ${formData.district} / ${formData.deliveryMethod}`,
    [formData.division, formData.district, formData.deliveryMethod]
  );

  const handleDivisionChange = (division: string) => {
    const nextDistrict = DISTRICTS_BY_DIVISION[division][0];
    setFormData((current) => ({
      ...current,
      division,
      district: nextDistrict,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      navigate('/products');
      return;
    }

    const orderDate = new Date().toISOString().split('T')[0];
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const orderBase = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerPhoneNormalized: normalizePhoneNumber(formData.phone),
        deliveryAddress: formData.address,
        deliveryArea: deliveryAreaLabel,
        deliveryDivision: formData.division,
        deliveryDistrict: formData.district,
        deliveryMethod: formData.deliveryMethod,
        deliveryDate: orderDate,
        paymentMethod: formData.paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          variant: item.variant,
          price: item.price,
        })),
        subtotal,
        deliveryCharge,
        total: subtotal + deliveryCharge,
        status: 'Pending' as const,
        createdAt: new Date().toISOString(),
      };

      const localFallbackOrderId = `local-order-${Date.now()}`;
      const localFallbackOrder = {
        id: localFallbackOrderId,
        userId: user?.id,
        ...orderBase,
      };

      if (canUseLocalOrderFallback()) {
        saveLocalDevOrder(localFallbackOrder);
        saveRecentOrder(localFallbackOrder);
        clearCart();
        navigate(`/order-confirmation/${localFallbackOrderId}`);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(
          mapOrderToRow({
            userId: user?.id,
            ...orderBase,
          })
        )
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      const savedOrder = {
        id: data.id,
        userId: user?.id,
        ...orderBase,
      };

      clearCart();
      saveRecentOrder(savedOrder);
      navigate(`/order-confirmation/${data.id}`);
    } catch (error) {
      if (canUseLocalOrderFallback()) {
        const localFallbackOrderId = `local-order-${Date.now()}`;
        const fallbackOrder = {
          id: localFallbackOrderId,
          userId: user?.id,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerPhoneNormalized: normalizePhoneNumber(formData.phone),
          deliveryAddress: formData.address,
          deliveryArea: deliveryAreaLabel,
          deliveryDivision: formData.division,
          deliveryDistrict: formData.district,
          deliveryMethod: formData.deliveryMethod,
          deliveryDate: orderDate,
          paymentMethod: formData.paymentMethod,
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            variant: item.variant,
            price: item.price,
          })),
          subtotal,
          deliveryCharge,
          total: subtotal + deliveryCharge,
          status: 'Pending' as const,
          createdAt: new Date().toISOString(),
        };

        saveLocalDevOrder(fallbackOrder);
        saveRecentOrder(fallbackOrder);
        clearCart();
        navigate(`/order-confirmation/${localFallbackOrderId}`);
        return;
      }

      console.error('Checkout failed', error);
      setSubmitError(
        hasSupabaseConfig
          ? 'Could not place the order right now. Please check your connection and try again.'
          : 'Store configuration is incomplete. Add the required Supabase environment variables before going live.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="fade-up-enter rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-xl font-black sm:mb-8 sm:text-2xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mango-orange/10 text-mango-orange sm:h-10 sm:w-10">
                  <Truck size={20} />
                </div>
                Delivery Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <UserIcon size={14} /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50/70 p-4 sm:p-6">
                  <div className="mb-4 flex items-center gap-3 sm:mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mango-orange/10 text-mango-orange sm:h-10 sm:w-10">
                      <LocateFixed size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-mango-dark sm:text-lg">Delivery Location</h3>
                      <p className="text-xs text-gray-500 sm:text-sm">Select division and district before choosing delivery method.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <Building2 size={14} /> Division
                      </label>
                      <select
                        value={formData.division}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                      >
                        {divisionOptions.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <MapPin size={14} /> District
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                      >
                        {districtOptions.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 sm:mt-5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <MapPin size={14} /> Full Delivery Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all resize-none"
                      placeholder="House, Road, Area, Landmark..."
                    />
                  </div>

                  <div className="mt-4 sm:mt-5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-3">
                      <Truck size={14} /> Delivery Method
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      {(['Home Delivery', 'Courier Pickup'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setFormData({ ...formData, deliveryMethod: method })}
                          className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all sm:rounded-2xl sm:px-4 sm:py-3 ${
                            formData.deliveryMethod === method
                              ? 'border-mango-orange bg-mango-orange/5 shadow-md'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <p className="text-base font-black text-mango-dark sm:text-lg">{method}</p>
                          <p className="mt-1 text-[13px] leading-snug text-gray-500 sm:text-sm">
                            {method === 'Home Delivery'
                              ? 'Delivered to the exact address selected above.'
                              : 'Pickup from courier point in the selected district.'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Selected Delivery Route</label>
                  <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-semibold text-mango-dark">
                    {deliveryAreaLabel}
                  </div>
                </div>

                <div className="pt-5 sm:pt-8">
                  <h3 className="mb-4 flex items-center gap-3 text-lg font-bold sm:mb-6 sm:text-xl">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mango-orange/10 text-mango-orange sm:h-10 sm:w-10">
                      <CreditCard size={20} />
                    </div>
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {(['bKash', 'Nagad', 'Cash on Delivery'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                        className={`min-w-0 rounded-xl border-2 px-2 py-2 text-[12px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:gap-1.5 ${
                          formData.paymentMethod === method
                            ? 'border-mango-orange bg-mango-orange/5 text-mango-orange shadow-md'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {method === 'Cash on Delivery' ? <Truck size={18} className="sm:h-5 sm:w-5" /> : <CreditCard size={18} className="sm:h-5 sm:w-5" />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-mango-orange py-4 text-base font-black text-white shadow-xl shadow-mango-orange/20 transition-all hover:bg-mango-orange/90 disabled:bg-gray-200 disabled:shadow-none sm:mt-12 sm:py-5 sm:text-lg"
                >
                  {isSubmitting ? 'Processing Order...' : `Place Order - ${formatCurrency(subtotal + deliveryCharge)}`}
                </button>
                {submitError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {submitError}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
              <h3 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">Order Summary</h3>
              <div className="mb-6 max-h-60 space-y-3 overflow-y-auto pr-2 sm:mb-8 sm:space-y-4">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variant}`} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50">
                        <img src={getThumbnailImageSrc(item.image)} alt={item.productName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </div>
                      <div>
                        <p className="font-bold text-mango-dark">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.quantity} x {item.variant}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-5 rounded-2xl bg-gray-50 px-4 py-3 sm:mb-6 sm:py-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Delivery Destination</p>
                <p className="mt-2 text-sm font-bold text-mango-dark">{deliveryAreaLabel}</p>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-5 sm:pt-6">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{formData.deliveryMethod}</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <span className="text-base font-bold sm:text-lg">Total</span>
                  <span className="text-xl font-black text-mango-orange sm:text-2xl">{formatCurrency(subtotal + deliveryCharge)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-orange-50 p-3.5 sm:mt-8 sm:p-4">
                <CheckCircle2 size={16} className="text-mango-orange shrink-0 mt-0.5" />
                <p className="text-[10px] text-mango-orange font-medium leading-relaxed">
                  By placing this order, you agree to our terms of service and delivery policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
