import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-mango-dark text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BrandLogo size="sm" dark={false} />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Bringing the finest, farm-fresh mangoes from Rajshahi and Chapainawabganj directly to your doorstep. Pesticide-free and naturally ripened.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/Jimbabu123" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-mango-orange transition-colors"><Facebook size={18} /></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-mango-orange transition-colors"><Instagram size={18} /></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-mango-orange transition-colors"><Twitter size={18} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Shop Mangoes</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Customer Service</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-mango-orange shrink-0" />
                <span>House 12, Road 5, Dhanmondi, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-mango-orange shrink-0" />
                <span>WhatsApp Order: +880 1307-367441</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-mango-orange shrink-0" />
                <span>hello@harivanga.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
          <p>&copy; 2026 Harivanga.com. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Designed for Mango Lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
