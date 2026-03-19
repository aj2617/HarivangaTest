import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapOrderRow, supabase } from '../supabase';
import { Seo } from '../components/Seo';
import { canUseLocalOrderFallback, findLocalDevOrdersByPhone } from '../lib/localDevOrders';
import { formatCurrency } from '../lib/format';
import { Order } from '../types';
import { Search, Package, Clock, CheckCircle2, Truck, Phone } from 'lucide-react';
import { format } from 'date-fns';

const normalizePhoneNumber = (phone: string) => phone.replace(/\D/g, '');

export const Account: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleTrackOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      setSearchError('Enter the phone number used for the order.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const localOrders = findLocalDevOrdersByPhone(phone);
      const orderMap = new Map<string, Order>();

      localOrders.forEach((order) => {
        orderMap.set(order.id, order);
      });

      if (canUseLocalOrderFallback()) {
        setOrders(
          Array.from(orderMap.values()).sort(
            (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          ).slice(0, 1)
        );
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone_normalized', normalizedPhone)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      (data ?? []).forEach((row) => {
        const order = mapOrderRow(row);
        orderMap.set(order.id, order);
      });

      const matchedOrders = Array.from(orderMap.values()).sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );

      setOrders(matchedOrders.slice(0, 1));
    } catch (error) {
      console.error('Failed to track orders by phone number', error);
      const fallbackOrders = findLocalDevOrdersByPhone(phone);
      if (fallbackOrders.length > 0) {
        setOrders(fallbackOrders.slice(0, 1));
        setSearchError(null);
        return;
      }

      setOrders([]);
      setSearchError('Could not check order status right now. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Seo title="Track Order" description="Track your mango order by phone number." path="/account" robots="noindex,nofollow" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fade-up-enter bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-black text-mango-dark">Track Your Order</h1>
            <p className="mt-3 text-gray-500">
              No login needed. Enter the phone number used at checkout to view your latest order updates.
            </p>
          </div>

          <form onSubmit={handleTrackOrders} className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              />
            </label>
            <button
              type="submit"
              disabled={isSearching}
              className="self-end rounded-2xl bg-mango-orange px-6 py-3 font-bold text-white transition-all hover:bg-mango-orange/90 disabled:bg-gray-200"
            >
              {isSearching ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {searchError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {searchError}
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-2xl font-black text-mango-dark mb-6">Order Status</h2>

            {orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="fade-up-enter bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm text-gray-500">Placed on {format(new Date(order.createdAt), 'PPP')}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${
                          order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                          order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'Confirmed' ? 'bg-mango-yellow/10 text-mango-yellow' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {order.status === 'Delivered' ? <CheckCircle2 size={14} /> :
                           order.status === 'Out for Delivery' ? <Truck size={14} /> :
                           order.status === 'Confirmed' ? <CheckCircle2 size={14} /> :
                           <Clock size={14} />}
                          {order.status}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-8">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl">
                            <span className="text-xs font-bold text-mango-dark">{item.quantity}x</span>
                            <span className="text-xs text-gray-500">{item.productName}</span>
                            <span className="text-[10px] text-gray-400">({item.variant})</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-50 gap-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total Amount</p>
                            <p className="font-black text-lg text-mango-dark">{formatCurrency(order.total)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Payment</p>
                            <p className="font-bold text-sm text-gray-600">{order.paymentMethod}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <button
                            onClick={() => navigate(`/order-confirmation/${order.id}`)}
                            className="flex-grow md:flex-grow-0 px-6 py-3 bg-gray-100 text-mango-dark rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Package size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">We could not find any order with that phone number.</p>
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Search size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Check your latest order</h3>
                <p className="text-gray-500">Enter your phone number above to see pending, confirmed, and delivered orders.</p>
                <button
                  onClick={() => navigate('/products')}
                  className="mt-6 text-mango-orange font-bold hover:underline"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
