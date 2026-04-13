import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, ShieldCheck, Truck, Leaf, Home as HomeIcon } from 'lucide-react';
import { ProductCard } from '../features/products/components/ProductCard';
import { useProducts } from '../features/products/hooks/useProducts';
import { ADMIN_SETTINGS_CHANGED_EVENT, ADMIN_SETTINGS_KEY, LEGACY_ADMIN_SETTINGS_KEY } from '../lib/adminSettings';
import slide1 from '../assets/home/slide-01.jpeg';
import slide2 from '../assets/home/slide-02.jpeg';
import slide3 from '../assets/home/slide-03.jpeg';
import slide4 from '../assets/home/slide-04.jpeg';
import slide5 from '../assets/home/slide-05.jpeg';
import slide6 from '../assets/home/slide-06.jpeg';
import slide7 from '../assets/home/slide-07.jpeg';
import slide8 from '../assets/home/slide-08.jpeg';
import slide9 from '../assets/home/slide-09.jpeg';
import slide10 from '../assets/home/slide-10.jpeg';

type HomePromotion = {
  promoStories: Array<{
    id: string;
    title: string;
    videoUrl: string;
    description: string;
  }>;
};

const DEFAULT_HOME_PROMOTION: HomePromotion = {
  promoStories: [],
};

const normalizePromoStories = (value: unknown): HomePromotion['promoStories'] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const story = entry as Partial<HomePromotion['promoStories'][number]>;
      const title = typeof story.title === 'string' ? story.title.trim() : '';
      const videoUrl = typeof story.videoUrl === 'string' ? story.videoUrl.trim() : '';
      const description = typeof story.description === 'string' ? story.description.trim() : '';

      if (!videoUrl) return null;

      return {
        id: typeof story.id === 'string' && story.id ? story.id : `story-${index + 1}`,
        title,
        videoUrl,
        description,
      };
    })
    .filter((story): story is HomePromotion['promoStories'][number] => story !== null);
};

const HOME_BANNER_SLIDES = [slide9, slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide10];

const HERO_TEXT = {
  badge: import.meta.env.VITE_HOME_HERO_BADGE?.trim() || 'Season 2026 Is Here',
  lineOne: import.meta.env.VITE_HOME_HERO_LINE_ONE?.trim() || 'Farm Fresh',
  highlight: import.meta.env.VITE_HOME_HERO_HIGHLIGHT?.trim() || 'Mangoes',
  lineTwo: import.meta.env.VITE_HOME_HERO_LINE_TWO?.trim() || 'for Every Doorstep',
  description:
    import.meta.env.VITE_HOME_HERO_DESCRIPTION?.trim() ||
    "Straight from Podaganj's legendary red-soil farms, our hand-picked Harivanga mangoes arrive tree-ripened, chemical-free, and packed for a premium fresh-fruit experience.",
};

const loadHomePromotion = (): HomePromotion => {
  if (typeof window === 'undefined') return DEFAULT_HOME_PROMOTION;

  try {
    const raw =
      window.localStorage.getItem(ADMIN_SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_ADMIN_SETTINGS_KEY);

    if (!raw) return DEFAULT_HOME_PROMOTION;

    const parsed = JSON.parse(raw) as Partial<HomePromotion> & {
      promoTitle?: string;
      promoVideoUrl?: string;
      promoDescription?: string;
    };
    const normalizedStories = normalizePromoStories(parsed.promoStories);

    return {
      promoStories:
        normalizedStories.length > 0
          ? normalizedStories
          : parsed.promoVideoUrl?.trim()
            ? [
                {
                  id: 'story-1',
                  title: parsed.promoTitle?.trim() ?? '',
                  videoUrl: parsed.promoVideoUrl.trim(),
                  description: parsed.promoDescription?.trim() ?? '',
                },
              ]
            : [],
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

const getYoutubeVideoId = (url: string): string | null => {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;

  try {
    const parsed = new URL(embedUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[1] ?? null;
  } catch {
    return null;
  }
};

const getYoutubeThumbnailUrl = (url: string): string | null => {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

const isDirectVideoFile = (url: string): boolean => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export const Home: React.FC = () => {
  const { products: featuredProducts } = useProducts({ limit: 4 });
  const [promotion, setPromotion] = useState<HomePromotion>(DEFAULT_HOME_PROMOTION);
  const [openPromoStoryIds, setOpenPromoStoryIds] = useState<Record<string, boolean>>({});
  const [activeBannerSlide, setActiveBannerSlide] = useState(0);
  const [typedHeroLength, setTypedHeroLength] = useState(0);

  const heroSegments = useMemo(
    () => [HERO_TEXT.lineOne, ' ', HERO_TEXT.highlight, ' ', HERO_TEXT.lineTwo],
    [],
  );
  const heroFullText = useMemo(() => heroSegments.join(''), [heroSegments]);

  useEffect(() => {
    const syncPromotion = () => {
      setPromotion(loadHomePromotion());
    };

    syncPromotion();
    window.addEventListener('storage', syncPromotion);
    window.addEventListener(ADMIN_SETTINGS_CHANGED_EVENT, syncPromotion);

    return () => {
      window.removeEventListener('storage', syncPromotion);
      window.removeEventListener(ADMIN_SETTINGS_CHANGED_EVENT, syncPromotion);
    };
  }, []);

  useEffect(() => {
    setOpenPromoStoryIds({});
  }, [promotion]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveBannerSlide((currentSlide) => (currentSlide + 1) % HOME_BANNER_SLIDES.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const totalLength = heroFullText.length;
    if (!totalLength) return;

    const timeoutId = window.setTimeout(() => {
      setTypedHeroLength((current) => (current >= totalLength ? totalLength : current + 1));
    }, 45);

    return () => window.clearTimeout(timeoutId);
  }, [typedHeroLength, heroFullText]);

  const typedHeroSegments = useMemo(() => {
    let remaining = typedHeroLength;

    return heroSegments.map((segment) => {
      if (remaining <= 0) return '';
      const value = segment.slice(0, remaining);
      remaining -= segment.length;
      return value;
    });
  }, [heroSegments, typedHeroLength]);

  const promoStories = promotion.promoStories.filter((story) => story.videoUrl.trim());
  const showPromotion = promoStories.length > 0;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(255,194,84,0.18),_rgba(255,255,255,1)_52%)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,250,241,0.96),rgba(255,255,255,0.88))]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[minmax(0,1.02fr)_minmax(430px,0.98fr)] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <span className="mb-6 inline-block rounded-full bg-mango-orange px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white sm:text-sm">
              {HERO_TEXT.badge}
            </span>
            <h1 className="max-w-4xl text-[3.05rem] font-black leading-[0.92] tracking-tight text-[#8f4b00] sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
              {typedHeroSegments[0]}
              {typedHeroSegments[1]}
              <span className="text-mango-orange italic">{typedHeroSegments[2]}</span>
              {typedHeroSegments[3]}
              {typedHeroSegments[4]}
              {typedHeroLength < heroFullText.length ? (
                <span aria-hidden="true" className="ml-1 inline-block animate-pulse text-mango-orange">
                  |
                </span>
              ) : null}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#6f6255] sm:text-lg">
              {HERO_TEXT.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                to="/products"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-mango-orange px-6 py-4 text-base font-bold text-white shadow-[0_16px_36px_rgba(255,107,53,0.26)] transition-all hover:bg-mango-orange/90 sm:w-auto sm:px-8"
              >
                Order Now
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#e6d7c4] bg-white/80 px-6 py-4 text-base font-bold text-[#8f4b00] transition-all hover:bg-white sm:w-auto sm:px-8"
              >
                Our Story
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-[radial-gradient(circle,_rgba(255,184,77,0.24),_transparent_65%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#201b16] p-3 shadow-[0_24px_60px_rgba(69,42,0,0.18)] sm:p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#1f1b16_0%,#2b241c_100%)] sm:aspect-[5/6] lg:h-[540px] lg:aspect-auto">
                <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/40 via-black/12 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black/55 via-black/18 to-transparent" />
                {HOME_BANNER_SLIDES.map((slideSrc, index) => (
                  <img
                    key={slideSrc}
                    src={slideSrc}
                    alt=""
                    aria-hidden={index !== activeBannerSlide}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      index === activeBannerSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                ))}

                <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f4b00] shadow-sm sm:left-5 sm:top-5">
                  Premium Harvest
                </div>
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm sm:bottom-5">
                  {HOME_BANNER_SLIDES.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveBannerSlide(index)}
                      aria-label={`Show banner slide ${index + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeBannerSlide ? 'w-7 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
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
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-mango-orange font-bold text-sm uppercase tracking-widest">Our Selection</span>
              <h2 className="mt-2 text-4xl font-black">Featured Varieties</h2>
            </div>
            <Link to="/products" className="text-mango-orange font-bold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} priority />
            ))}
          </div>
        </div>
      </section>

      {showPromotion && (
        <section className="bg-[#fff8f1] py-10 [content-visibility:auto] [contain-intrinsic-size:1px_520px]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-8 max-w-[210px] text-center sm:max-w-none">
              <h2 className="text-[1.7rem] font-black uppercase tracking-[0.08em] leading-[1.02] text-[#201b16] sm:text-4xl sm:tracking-[0.18em]">
                Stories to Watch
              </h2>
              <div className="mt-4 flex items-center justify-center gap-2.5 sm:gap-4">
                <span className="h-px w-9 bg-[#d4c7b6] sm:w-16" />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#eadfce] sm:h-12 sm:w-12">
                  <img src="/logo.png" alt="" aria-hidden="true" className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
                </div>
                <span className="h-px w-9 bg-[#d4c7b6] sm:w-16" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              {promoStories.map((story, index) => {
                const embedUrl = getYoutubeEmbedUrl(story.videoUrl);
                const thumbnailUrl = getYoutubeThumbnailUrl(story.videoUrl);
                const isOpen = Boolean(openPromoStoryIds[story.id]);

                return (
                  <article
                    key={story.id}
                    className="overflow-hidden rounded-2xl border border-[#dfe5df] bg-white p-2 shadow-[0_8px_26px_rgba(44,62,45,0.08)]"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1d241e]">
                      {!isOpen ? (
                        <button
                          type="button"
                          onClick={() => setOpenPromoStoryIds((current) => ({ ...current, [story.id]: true }))}
                          aria-label={story.title ? `Play ${story.title}` : 'Play story video'}
                          className="relative block h-full w-full overflow-hidden"
                        >
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={story.title || 'Story thumbnail'}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading={index === 0 ? 'eager' : 'lazy'}
                              fetchPriority={index === 0 ? 'high' : 'auto'}
                              decoding="async"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,#36513f_0%,#1d241e_100%)]" />
                          )}
                          <div className="absolute inset-0 bg-black/15" />
                          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 backdrop-blur-[2px] shadow-[0_12px_24px_rgba(0,0,0,0.28)]">
                            <span className="ml-1 block h-0 w-0 border-y-[9px] border-y-transparent border-l-[14px] border-l-white" />
                          </span>
                        </button>
                      ) : embedUrl ? (
                        <iframe
                          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                          title={story.title || 'Story video'}
                          className="h-full w-full"
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : isDirectVideoFile(story.videoUrl) ? (
                        <video
                          src={story.videoUrl}
                          controls
                          preload="metadata"
                          autoPlay
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
                          <PlayCircle size={52} className="text-white/90" />
                          <a
                            href={story.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#ff2f1a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e52814]"
                          >
                            Watch Video
                            <ArrowRight size={16} />
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
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
