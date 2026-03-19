import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapOrderToRow, supabase } from '../supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Seo } from '../components/Seo';
import { canUseLocalOrderFallback, saveLocalDevOrder } from '../lib/localDevOrders';
import { CheckCircle2, CreditCard, Truck, MapPin, Phone, User as UserIcon, Building2, LocateFixed } from 'lucide-react';
import { formatCurrency } from '../lib/format';

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

      clearCart();
      navigate(`/order-confirmation/${data.id}`);
    } catch (error) {
      if (canUseLocalOrderFallback()) {
        const localFallbackOrderId = `local-order-${Date.now()}`;
        saveLocalDevOrder({
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
          status: 'Pending',
          createdAt: new Date().toISOString(),
        });
        clearCart();
        navigate(`/order-confirmation/${localFallbackOrderId}`);
        return;
      }

      console.error('Checkout failed', error);
      setSubmitError('Could not place the order right now. Please check your connection or Supabase setup and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Seo title="Checkout" description="Complete your mango order securely." path="/checkout" robots="noindex,nofollow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="fade-up-enter bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-mango-orange/10 text-mango-orange rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                Delivery Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-mango-orange/10 text-mango-orange rounded-xl flex items-center justify-center">
                      <LocateFixed size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-mango-dark">Delivery Location</h3>
                      <p className="text-sm text-gray-500">Select division and district before choosing delivery method.</p>
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

                  <div className="mt-5 space-y-2">
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

                  <div className="mt-5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-3">
                      <Truck size={14} /> Delivery Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(['Home Delivery', 'Courier Pickup'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setFormData({ ...formData, deliveryMethod: method })}
                          className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                            formData.deliveryMethod === method
                              ? 'border-mango-orange bg-mango-orange/5 shadow-md'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <p className="font-black text-mango-dark">{method}</p>
                          <p className="mt-1 text-sm text-gray-500">
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

                <div className="pt-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-mango-orange/10 text-mango-orange rounded-xl flex items-center justify-center">
                      <CreditCard size={20} />
                    </div>
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['bKash', 'Nagad', 'Cash on Delivery'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                          formData.paymentMethod === method
                            ? 'border-mango-orange bg-mango-orange/5 text-mango-orange shadow-md'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {method === 'Cash on Delivery' ? <Truck size={24} /> : <CreditCard size={24} />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full mt-12 bg-mango-orange text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all disabled:bg-gray-200 disabled:shadow-none"
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
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variant}`} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50">
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
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

              <div className="rounded-2xl bg-gray-50 px-4 py-4 mb-6">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Delivery Destination</p>
                <p className="mt-2 text-sm font-bold text-mango-dark">{deliveryAreaLabel}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{formData.deliveryMethod}</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-mango-orange">{formatCurrency(subtotal + deliveryCharge)}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-orange-50 rounded-2xl flex items-start gap-3">
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
