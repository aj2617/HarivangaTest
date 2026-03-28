import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';

export const ProductListing: React.FC = () => {
  const { products: allProducts, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('All');
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const products = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || product.name.toLowerCase().includes(normalizedSearch)
        || product.variety.toLowerCase().includes(normalizedSearch);
      const matchesVariety = selectedVariety === 'All' || product.variety === selectedVariety;

      return matchesSearch && matchesVariety;
    });
  }, [allProducts, normalizedSearch, selectedVariety]);

  const varieties = useMemo(
    () => ['All', ...Array.from(new Set(allProducts.map((product) => product.variety)))],
    [allProducts]
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-mango-dark sm:text-4xl">Shop Fresh Mangoes</h1>
            <p className="text-sm text-gray-500 sm:text-base">Discover authentic Harivanga and premium mangoes from Podagonj, Mithapukur, Rangpur.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="appearance-none pl-12 pr-10 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-orange/20 focus:border-mango-orange transition-all cursor-pointer"
              >
                {varieties.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading products...</h3>
            <p className="text-gray-500">Fetching the latest product list.</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 [content-visibility:auto] [contain-intrinsic-size:1px_1400px]">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="fade-up-enter"
                style={{ animationDelay: `${Math.min(index, 7) * 80}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No mangoes found</h3>
            <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedVariety('All'); }}
              className="mt-6 text-mango-orange font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
