import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, ShieldCheck, Truck, Leaf, Home as HomeIcon } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';

const ADMIN_SETTINGS_KEY = 'harivanga_admin_settings';
const LEGACY_ADMIN_SETTINGS_KEY = 'mangobd_admin_settings';

type HomePromotion = {
  promoVideoUrl: string;
  promoDescription: string;
};

const DEFAULT_HOME_PROMOTION: HomePromotion = {
  promoVideoUrl: '',
  promoDescription: '',
};

const loadHomePromotion = (): HomePromotion => {
  if (typeof window === 'undefined') return DEFAULT_HOME_PROMOTION;

  try {
    const raw =
      window.localStorage.getItem(ADMIN_SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_ADMIN_SETTINGS_KEY);

    if (!raw) return DEFAULT_HOME_PROMOTION;

    const parsed = JSON.parse(raw) as Partial<HomePromotion>;
    return {
      promoVideoUrl: parsed.promoVideoUrl?.trim() ?? '',
      promoDescription: parsed.promoDescription?.trim() ?? '',
    };
  } catch {
    return DEFAULT_HOME_PROMOTION;
  }
};

const getYoutubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const isDirectVideoFile = (url: string): boolean => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export const Home: React.FC = () => {
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 4);
  const [promotion, setPromotion] = useState<HomePromotion>(DEFAULT_HOME_PROMOTION);
  const [isPromoVideoOpen, setIsPromoVideoOpen] = useState(false);

  useEffect(() => {
    setPromotion(loadHomePromotion());
  }, []);

  useEffect(() => {
    setIsPromoVideoOpen(false);
  }, [promotion.promoVideoUrl]);

  const promoVideoUrl = promotion.promoVideoUrl.trim();
  const promoDescription = promotion.promoDescription.trim();
  const promoEmbedUrl = promoVideoUrl ? getYoutubeEmbedUrl(promoVideoUrl) : null;
  const showPromotion = promoVideoUrl.length > 0;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] sm:min-h-[680px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/downloaded/hero.webp"
            alt="Fresh Mangoes"
            className="w-full h-full object-cover"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-mango-dark/80 via-mango-dark/40 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-24 pb-14 sm:pb-20 relative z-10 w-full">
          <div className="max-w-3xl fade-up-enter">
            <span className="inline-block bg-mango-orange text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] mb-6">
              Season 2026 is Here
            </span>
            <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[0.95] mb-6">
              Farm Fresh <span className="text-mango-yellow">Mangoes</span>, Delivered to Your Door
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mb-8 sm:mb-10 leading-relaxed max-w-2xl">
              Straight from Podaganj&apos;s legendary red-soil farms — where the world&apos;s best Harivanga grows. Tree-ripened, chemical-free, delivered fresh.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 max-w-3xl">
              <Link
                to="/products"
                className="w-full sm:w-auto bg-mango-orange hover:bg-mango-orange/90 text-white px-6 sm:px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-mango-orange/20 group"
              >
                Shop Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 sm:px-8 py-4 rounded-2xl font-bold transition-all text-center"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-mango-yellow/5 border-y border-mango-yellow/10 [content-visibility:auto] [contain-intrinsic-size:1px_480px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-mango-orange">
                <Leaf size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">100% Fresh</h4>
                <p className="text-xs text-gray-500">Direct from farm</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-mango-orange">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Fast Delivery</h4>
                <p className="text-xs text-gray-500">Within 2 days</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-mango-orange">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Pesticide Free</h4>
                <p className="text-xs text-gray-500">Naturally ripened</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-mango-orange">
                <HomeIcon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Farm to Table</h4>
                <p className="text-xs text-gray-500">No middleman</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white [content-visibility:auto] [contain-intrinsic-size:1px_900px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-12">
            <div>
              <span className="text-mango-orange font-bold text-sm uppercase tracking-widest">Our Selection</span>
              <h2 className="text-4xl font-black mt-2">Featured Varieties</h2>
            </div>
            <Link to="/products" className="text-mango-orange font-bold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {showPromotion && (
        <section className="bg-[#fff8f1] py-20 [content-visibility:auto] [contain-intrinsic-size:1px_760px]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-mango-orange">Promotion</span>
              <h2 className="mt-3 text-3xl font-black text-[#201b16] sm:text-4xl">Watch Our Latest Story</h2>
              {promoDescription && (
                <p className="mt-4 text-base leading-relaxed text-[#6f6255]">{promoDescription}</p>
              )}
            </div>

            <div className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-white shadow-sm">
              <div className="aspect-video bg-[#201b16]">
                {!isPromoVideoOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsPromoVideoOpen(true)}
                    className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.32),_rgba(32,27,22,0.98)_62%)] px-6 text-center text-white"
                  >
                    <PlayCircle size={56} className="text-mango-yellow" />
                    <p className="text-lg font-bold">Play promotion video</p>
                    <p className="max-w-xl text-sm text-white/75">The video loads only after click to keep the home page lighter.</p>
                  </button>
                ) : promoEmbedUrl ? (
                  <iframe
                    src={`${promoEmbedUrl}${promoEmbedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                    title="Promotion video"
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : isDirectVideoFile(promoVideoUrl) ? (
                  <video
                    src={promoVideoUrl}
                    controls
                    preload="metadata"
                    autoPlay
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
                    <PlayCircle size={52} className="text-mango-yellow" />
                    <p className="max-w-xl text-sm text-white/80">This promotion uses an external video link. Open it directly to watch.</p>
                    <a
                      href={promoVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-mango-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-mango-orange/90"
                    >
                      Watch Video
                      <ArrowRight size={16} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-24 bg-mango-dark text-white overflow-hidden relative [content-visibility:auto] [contain-intrinsic-size:1px_1100px]">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <img 
            src="/images/downloaded/pattern.webp" 
            alt="Pattern" 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-8 leading-tight">
                Why Harivanga.com is the <span className="text-mango-yellow">Trusted Choice</span> for Thousands
              </h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 bg-mango-orange rounded-2xl flex items-center justify-center font-bold text-xl">01</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Authentic Origin</h3>
                    <p className="text-gray-400 leading-relaxed">We source from Podaganj, Mithapukur, Rangpur, where Harivanga grows in its signature red-soil terroir.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 bg-mango-orange rounded-2xl flex items-center justify-center font-bold text-xl">02</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Quality Control</h3>
                    <p className="text-gray-400 leading-relaxed">Each mango is hand-inspected for ripeness, size, and quality before being packed in our eco-friendly boxes.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 bg-mango-orange rounded-2xl flex items-center justify-center font-bold text-xl">03</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Fair Pricing</h3>
                    <p className="text-gray-400 leading-relaxed">By cutting out middlemen, we ensure farmers get a fair price and you get premium quality at the best value.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/downloaded/farm.webp" 
                  alt="Farm" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-mango-orange p-8 rounded-3xl shadow-xl hidden md:block">
                <p className="text-3xl font-black">10k+</p>
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
