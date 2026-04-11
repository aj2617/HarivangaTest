import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { Product } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { formatCurrency } from '../../../lib/format';
import { getThumbnailImageSrc } from '../../../lib/imageSources';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { addToCart } = useCart();
  const [imageFailed, setImageFailed] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      variant: product.variants[0]?.weight || '1kg',
      price: product.variants[0]?.price || product.pricePerKg,
      image: product.image
    });
  };

  return (
    <div className="group card-hover-lift rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-xl">
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden">
        {imageFailed && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#fff4de] via-[#fffaf1] to-[#f4ede1]" />
            <div className="absolute inset-0 transition-opacity duration-300 opacity-100">
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-mango-orange shadow-sm">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-mango-dark">{product.name}</p>
                  <p className="mt-1 text-xs text-gray-500">Image unavailable</p>
                </div>
              </div>
            </div>
          </>
        )}
        <img
          src={getThumbnailImageSrc(product.image)}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageFailed ? 'opacity-0' : 'opacity-100'}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          width={320}
          height={320}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          onLoad={() => {
            setImageFailed(false);
          }}
          onError={() => {
            setImageFailed(true);
          }}
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-mango-dark px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Out of Season</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-mango-orange text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
            {product.variety}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-bold text-mango-dark group-hover:text-mango-orange transition-colors mb-4">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Starting from</span>
            <span className="text-xl font-bold text-mango-dark">{formatCurrency(product.pricePerKg)}</span>
            <span className="text-xs text-gray-400 ml-1">/kg</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="p-3 bg-mango-orange text-white rounded-xl hover:bg-mango-orange/90 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-mango-orange/20"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
