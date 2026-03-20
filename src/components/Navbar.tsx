import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { signOutUser } = await import('../supabase');
    await signOutUser();
    navigate('/');
  };

  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-mango-orange text-white shadow-lg shadow-mango-orange/20'
        : 'text-mango-dark hover:bg-mango-yellow/20 hover:text-mango-orange'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
      isActive ? 'bg-mango-orange text-white' : 'hover:bg-mango-yellow/10 text-mango-dark'
    }`;

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3 rounded-full border border-white/60 bg-white/70 p-2 shadow-sm backdrop-blur-md">
            <NavLink to="/" end className={desktopNavLinkClass}>Home</NavLink>
            <NavLink to="/products" className={desktopNavLinkClass}>Shop Mangoes</NavLink>
            <NavLink to="/about" className={desktopNavLinkClass}>Our Story</NavLink>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/account" className="p-2 hover:bg-mango-yellow/10 rounded-full transition-colors" title="Track Order">
              <User size={20} />
            </Link>
            <button onClick={() => navigate('/cart')} className="p-2 hover:bg-mango-yellow/10 rounded-full transition-colors relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-mango-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
            {user && (
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500">
                <LogOut size={20} />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => navigate('/cart')} className="p-2 relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-mango-orange text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className="mobile-menu-panel md:hidden border-t border-gray-100 bg-white"
        data-open={isMenuOpen}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-panel-inner">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <NavLink to="/" end onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Home</NavLink>
            <NavLink to="/products" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Shop Mangoes</NavLink>
            <NavLink to="/about" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Our Story</NavLink>
            <NavLink to="/account" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClass}>Track Order</NavLink>
            {user && (
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-red-500 hover:bg-red-50 rounded-md">Logout</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
