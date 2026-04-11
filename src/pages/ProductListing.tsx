import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../features/products/components/ProductCard';
import { useProducts } from '../features/products/hooks/useProducts';

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

          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative min-w-0 flex-1 md:w-72 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 transition-all"
              />
            </div>
            <div className="relative w-32 shrink-0">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm focus:border-mango-orange focus:outline-none focus:ring-2 focus:ring-mango-orange/20 transition-all"
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8 [content-visibility:auto] [contain-intrinsic-size:1px_1400px]">
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
