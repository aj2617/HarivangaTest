import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { User, Package, MapPin, Phone, LogOut, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export const Account: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const activeProfile = profile;
  const activeName = user?.displayName || profile?.name || 'Harivanga Customer';
  const activeEmailOrPhone = user?.email || user?.phoneNumber || profile?.phone;

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
      setOrdersLoading(false);
    }, (error) => {
      console.error('Failed to load account orders', error);
      setOrders([]);
      setOrdersLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.';
      setLoginError(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mango-orange"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-mango-orange/10 text-mango-orange rounded-full flex items-center justify-center mx-auto mb-8">
            <User size={40} />
          </div>
          <h2 className="text-3xl font-black text-mango-dark mb-4">Welcome Back</h2>
          <p className="text-gray-500 mb-10">Login to track your orders, save addresses, and enjoy a faster checkout experience.</p>
          {loginError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {loginError}
            </div>
          )}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all mb-4"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          
          <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">
            Secure Login Powered by Firebase
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 bg-mango-orange rounded-full flex items-center justify-center mx-auto mb-6 text-white font-black text-3xl shadow-lg shadow-mango-orange/20">
                {activeName?.[0] || activeEmailOrPhone?.[0] || 'U'}
              </div>
              <h3 className="text-xl font-bold text-mango-dark mb-1">{activeName}</h3>
              <p className="text-sm text-gray-400 mb-6">{activeEmailOrPhone}</p>
              <button 
                onClick={() => auth.signOut()}
                className="w-full py-3 rounded-xl border border-gray-100 text-sm font-bold text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-1">
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-mango-orange/5 text-mango-orange font-bold transition-all">
                <div className="flex items-center gap-3">
                  <Package size={20} /> My Orders
                </div>
                <ChevronRight size={16} />
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl text-gray-500 hover:bg-gray-50 font-bold transition-all">
                <div className="flex items-center gap-3">
                  <MapPin size={20} /> Saved Addresses
                </div>
                <ChevronRight size={16} />
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl text-gray-500 hover:bg-gray-50 font-bold transition-all">
                <div className="flex items-center gap-3">
                  <User size={20} /> Profile Settings
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <h2 className="text-3xl font-black text-mango-dark mb-8">Order History</h2>

            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mango-orange"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
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
                            <p className="font-black text-lg text-mango-dark">৳{order.total}</p>
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
                          <button className="flex-grow md:flex-grow-0 px-6 py-3 bg-mango-orange text-white rounded-xl font-bold text-sm hover:bg-mango-orange/90 transition-all shadow-lg shadow-mango-orange/10">
                            Reorder
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Package size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500">When you place an order, it will appear here.</p>
                <button 
                  onClick={() => navigate('/products')}
                  className="mt-6 text-mango-orange font-bold hover:underline"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
