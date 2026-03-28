import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Star,
  MapPin,
  Truck,
  ShieldCheck,
  Leaf,
  MessageCircle,
  ChevronRight,
  Minus,
  Plus,
  Zap,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getCachedStorefrontProducts } from '../hooks/useProducts';
import { fetchStorefrontProductById } from '../lib/publicProducts';
import { hasSupabaseConfig } from '../lib/env';
import { formatCurrency } from '../lib/format';
import { Product } from '../types';
import { getDisplayImageSrc, getThumbnailImageSrc } from '../lib/imageSources';
import { getLocalDevProducts } from '../lib/localDevProducts';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, replaceCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] = useState(product?.variants[0] || null);
  const [selectedImage, setSelectedImage] = useState(product?.image || product?.images?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const galleryImages = product ? [product.image, ...(product.images ?? []).filter((image) => image !== product.image)] : [];

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      setProduct(null);
      setProductLoading(false);
      return;
    }

    const loadFallbackProduct = async () => {
      const localProducts = await getLocalDevProducts();
      if (!cancelled) {
        setProduct(localProducts.find((entry) => entry.id === id) ?? null);
      }
    };

    const controller = new AbortController();
    const cachedProduct = getCachedStorefrontProducts().find((entry) => entry.id === id);

    if (cachedProduct) {
      setProduct(cachedProduct);
      setProductLoading(false);
    } else {
      setProductLoading(true);
    }

    const loadProduct = async () => {
      if (!hasSupabaseConfig) {
        await loadFallbackProduct();
        if (!cancelled) {
          setProductLoading(false);
        }
        return;
      }

      try {
        const fetchedProduct = await fetchStorefrontProductById(id, controller.signal);
        if (fetchedProduct) {
          if (!cancelled) {
            setProduct(fetchedProduct);
          }
          return;
        }

        await loadFallbackProduct();
      } catch (error) {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        console.error('Failed to load product detail', error);
        await loadFallbackProduct();
      } finally {
        if (!controller.signal.aborted && !cancelled) {
          setProductLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    setSelectedVariant(product?.variants[0] || null);
    setSelectedImage(product?.image || product?.images?.[0] || '');
  }, [product]);

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mango-orange"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button onClick={() => navigate('/products')} className="text-mango-orange font-bold">
          Back to Shop
        </button>
      </div>
    );
  }

  const totalPrice = (selectedVariant?.price || 0) * quantity;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart({
      productId: product.id,
      productName: product.name,
      quantity,
      variant: selectedVariant.weight,
      price: selectedVariant.price,
      image: product.image,
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariant || !product.isAvailable) return;
    replaceCart([
      {
        productId: product.id,
        productName: product.name,
        quantity,
        variant: selectedVariant.weight,
        price: selectedVariant.price,
        image: product.image,
      },
    ]);
    navigate('/checkout');
  };

  const handleWhatsAppOrder = () => {
    const message = `Hello! I'd like to order ${quantity} x ${product.name} (${selectedVariant?.weight}). Total: ${formatCurrency(totalPrice)}`;
    window.open(`https://wa.me/8801342262821?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button onClick={() => navigate('/')} className="hover:text-mango-orange">
              Home
            </button>
            <ChevronRight size={12} />
            <button onClick={() => navigate('/products')} className="hover:text-mango-orange">
              Shop
            </button>
            <ChevronRight size={12} />
            <span className="text-mango-dark font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-4 fade-up-enter">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 group">
              <img
                src={getDisplayImageSrc(selectedImage || product.image)}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                decoding="async"
                fetchPriority="high"
                width={960}
                height={960}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="bg-mango-orange text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {product.variety}
                </span>
                <span className="bg-white text-mango-dark text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                  <MapPin size={10} /> {product.origin}
                </span>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {galleryImages.map((image, index) => {
                  const isActive = image === (selectedImage || product.image);
                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-2xl border-2 ${isActive ? 'border-mango-orange' : 'border-transparent'}`}
                    >
                      <img
                        src={getThumbnailImageSrc(image)}
                        alt={`${product.name} view ${index + 1}`}
                        className="aspect-square h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={240}
                        height={240}
                        sizes="(min-width: 640px) 25vw, 33vw"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-mango-yellow mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < 4 ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="text-sm font-bold text-mango-dark">4.8</span>
              <span className="text-sm text-gray-400">(128 Reviews)</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-mango-dark mb-4 leading-tight">{product.name}</h1>

            <p className="text-gray-500 text-lg leading-relaxed mb-8">{product.description}</p>

            <div className="grid grid-cols-2 gap-6 mb-10 [content-visibility:auto] [contain-intrinsic-size:1px_220px]">
              <div className="p-4 bg-mango-yellow/5 rounded-2xl border border-mango-yellow/10">
                <span className="text-xs text-gray-400 block mb-1">Taste Profile</span>
                <span className="font-bold text-sm">{product.tasteProfile}</span>
              </div>
              <div className="p-4 bg-mango-orange/5 rounded-2xl border border-mango-orange/10">
                <span className="text-xs text-gray-400 block mb-1">Availability</span>
                <span className="font-bold text-sm">{product.isAvailable ? 'In Season' : 'Out of Season'}</span>
              </div>
            </div>

            <div className="mb-10 [content-visibility:auto] [contain-intrinsic-size:1px_200px]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Select Weight</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => (
                  <button
                    key={v.weight}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                      selectedVariant?.weight === v.weight
                        ? 'border-mango-orange bg-mango-orange/5 text-mango-orange shadow-md'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {v.weight} - {formatCurrency(v.price)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
              <div className="flex items-center bg-gray-100 rounded-2xl p-1 w-full sm:w-auto">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-white rounded-xl transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-white rounded-xl transition-colors">
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid w-full flex-grow grid-cols-1 gap-3 lg:grid-cols-2">
                <button
                  onClick={handleBuyNow}
                  disabled={!product.isAvailable}
                  className="w-full bg-mango-dark hover:bg-mango-dark/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-mango-dark/10 disabled:bg-gray-200 disabled:shadow-none"
                >
                  <Zap size={20} />
                  Buy Now - {formatCurrency(totalPrice)}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                  className="w-full bg-mango-orange hover:bg-mango-orange/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-mango-orange/20 disabled:bg-gray-200 disabled:shadow-none"
                >
                  <ShoppingCart size={20} />
                  Add to Cart - {formatCurrency(totalPrice)}
                </button>
              </div>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/20 mb-12"
            >
              <MessageCircle size={20} />
              Order via WhatsApp
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-gray-100 [content-visibility:auto] [contain-intrinsic-size:1px_220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <Leaf size={20} />
                </div>
                <span className="text-xs font-bold text-gray-600">Naturally Ripened</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <span className="text-xs font-bold text-gray-600">Safe Delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-xs font-bold text-gray-600">Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
