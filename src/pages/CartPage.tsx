import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Seo } from '../components/Seo';
import { formatCurrency } from '../lib/format';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();
  const navigate = useNavigate();
  const deliveryCharge = 60; // Flat rate for Dhaka

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-300">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-3xl font-black text-mango-dark mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs text-center">Looks like you haven't added any delicious mangoes to your cart yet.</p>
        <Link 
          to="/products" 
          className="bg-mango-orange text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Seo title="Shopping Cart" description="Review selected mangoes before checkout." path="/cart" robots="noindex,nofollow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-mango-dark mb-12">Shopping Cart ({totalItems})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.variant}`}
                className="fade-up-enter bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-mango-dark">{item.productName}</h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.variant}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId, item.variant)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-mango-dark">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold mb-8">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-mango-dark">{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-mango-orange">{formatCurrency(subtotal + deliveryCharge)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-mango-orange text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-mango-orange/20 hover:bg-mango-orange/90 transition-all"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </button>
                <Link 
                  to="/products" 
                  className="w-full block text-center py-4 text-sm font-bold text-gray-400 hover:text-mango-dark transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} />
                </div>
                <p className="text-[10px] text-green-800 leading-relaxed">
                  Your order is eligible for <span className="font-bold">Same Day Delivery</span> in Dhaka if placed before 12:00 PM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
