import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mapOrderRow, supabase } from '../supabase';
import { getLocalDevOrderById } from '../lib/localDevOrders';
import { formatCurrency } from '../lib/format';
import { getRecentOrderById } from '../lib/recentOrders';
import { hasSupabaseConfig } from '../lib/env';
import { Order } from '../types';
import { CheckCircle, Package, Truck, MessageCircle, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams();
  const { user, isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const recentOrder = getRecentOrderById(orderId);
      if (recentOrder) {
        setOrder(recentOrder);
        setLoading(false);
        return;
      }

      const localOrder = getLocalDevOrderById(orderId);
      if (localOrder) {
        setOrder(localOrder);
        setLoading(false);
        return;
      }

      if (!user && !isAdmin) {
        setLoading(false);
        return;
      }

      if (!hasSupabaseConfig) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('orders')
        .select('*')
        .eq('id', orderId);

      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Failed to load order', error);
      } else if (data) {
        setOrder(mapOrderRow(data));
      }
      setLoading(false);
    };
    fetchOrder();
  }, [isAdmin, orderId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mango-orange"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Link to="/" className="text-mango-orange font-bold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fade-up-enter bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-mango-orange p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <Package size={200} className="absolute -top-10 -left-10 rotate-12" />
              <Truck size={150} className="absolute -bottom-10 -right-10 -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-black mb-2">Thank You!</h1>
              <p className="text-white/80 font-medium">Your order has been placed successfully.</p>
              <div className="mt-6 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                Order ID: #{order.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Truck size={20} className="text-mango-orange" />
                  Delivery Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-mango-dark">{order.customerName}</p>
                      <p className="text-gray-500 leading-relaxed">{order.deliveryAddress}</p>
                      <p className="text-gray-500">{order.deliveryArea}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <p className="text-gray-500">Scheduled for: <span className="font-bold text-mango-dark">{order.deliveryDate}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package size={20} className="text-mango-orange" />
                  Order Summary
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.quantity} x {item.productName} ({item.variant})</span>
                      <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold">Total Paid</span>
                    <span className="text-xl font-black text-mango-orange">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-mango-yellow/5 rounded-3xl p-8 border border-mango-yellow/10 mb-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-mango-yellow/20 text-mango-yellow rounded-2xl flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">Need help with your order?</h4>
                    <p className="text-sm text-gray-500">Our support team is available 24/7 on WhatsApp.</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/8801307367441?text=I have a question about my order #${order.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#25D366]/90 transition-all shadow-lg shadow-green-500/20"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/account"
                className="flex-grow bg-mango-dark text-white py-4 rounded-2xl font-bold text-center hover:bg-mango-dark/90 transition-all"
              >
                Track By Phone Number
              </Link>
              <Link
                to="/"
                className="flex-grow bg-gray-100 text-mango-dark py-4 rounded-2xl font-bold text-center hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                Continue Shopping
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
