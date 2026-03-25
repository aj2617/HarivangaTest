import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowRight, Clock3, Leaf, MapPin, ShieldCheck, Sprout, SunMedium, Truck, Trophy } from 'lucide-react';

type InfoSection = {
  heading: string;
  body: string;
};

type InfoPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  highlights: string[];
  sections: InfoSection[];
};

const INFO_PAGE_CONTENT: Record<string, InfoPageContent> = {
  '/about': {
    eyebrow: 'হাড়িভাঙ্গার গল্প',
    title: 'আমাদের গল্প',
    intro:
      'Harivanga.com রংপুরের বিখ্যাত মিঠাপুকুর থানার পদাগঞ্জের লাল মাটির নিজস্ব বাগান থেকে, সম্পুর্ন ক্যামিকেল মুক্ত, সতেজ, গার্ডেনফ্রেশ হাড়িভাঙ্গা আমগুলো সংগ্রহ করে সরাসরি গ্রাহকের ঘরে পৌঁছে দেয়। আমাদের লক্ষ্য একটাই — রংপুরের লাল মাটির সেই অনন্য স্বাদ কোনো আপোস ছাড়া পৌঁছে দেওয়া।',
    highlights: ['পদাগঞ্জের নিজস্ব বাগান', 'ক্যামিকেল মুক্ত ও সতেজ', 'সরাসরি গ্রাহকের ঘরে ডেলিভারি'],
    sections: [
      {
        heading: 'শুরুর গল্প',
        body:
          'রংপুরের মিঠাপুকুর উপজেলার, খোড়াগাছ ইউনিয়নের, পদাগন্জের তেকানির মোড় গ্রামে বহু বছর আগে (মো: নাফাল উদ্দিন পাইকার) তাঁর জমিতে একটি আমগাছের চারা রোপণ করেন। প্রতিকূল মাটি, তীব্র রোদ আর খরার মধ্যেও তিনি বিশেষ ব্যবস্থায় গাছের গোড়ায় ধীরে ধীরে পানি দিতেন। সেই যত্নের ফলেই জন্ম নেয় এমন একটি পরিপূর্ণ আমগাছ। সেই গাছ থেকে ফল আসে, যার স্বাদ, ঘ্রাণ ও রসালত্ব গ্রামবাসীকে প্রথম ফলনেই বিস্মিত করেছিল। সেটিই ছিল বিখ্যাত হাড়িভাঙ্গা আম। যেটি কী না হাঁড়িতে পরে হাঁড়িকে ভেঙ্গে দিয়েছিল। সেই থেকে এর প্রচলন চলমান।',
      },
      {
        heading: 'লাল মাটির স্বাদ',
        body:
          'পদাগঞ্জের খনিজসমৃদ্ধ লাল মাটি, রংপুরের আবহাওয়া, মৌসুমি বৃষ্টি এবং ধীর প্রাকৃতিক পাকার প্রক্রিয়া হাড়িভাঙ্গাকে দিয়েছে আলাদা পরিচয়। এই আমে কোনো কৃত্রিম রঙ বা রাসায়নিক পাকানোর প্রয়োজন হয় না। গাছেই ধীরে ধীরে পাকে, আর পাকলে খোসায় ফুটে ওঠে হালকা লালচে আভা।',
      },
      {
        heading: 'বাংলাদেশের গর্ব',
        body:
          'হাড়িভাঙ্গা আজ শুধু একটি ফল নয়, এটি উত্তরবঙ্গের কৃষি ঐতিহ্য ও গর্বের প্রতীক। ভৌগোলিক নির্দেশক (GI) স্বীকৃত এই আমের জন্য মৌসুমে দেশের বিভিন্ন অঞ্চল থেকে পাইকাররা পদাগঞ্জে ছুটে আসেন। বিশেষ করে মৌসুমের শেষভাগে হাড়িভাঙ্গা আসে সেরা বিদায়ী উপহার হয়ে।',
      },
      {
        heading: 'Harivanga.com-এর প্রতিশ্রুতি',
        body:
          'আমরা পদাগঞ্জের বিশ্বস্ত বাগান থেকে বাছাই করা হাড়িভাঙ্গা সংগ্রহ করি, যাতে মধ্যস্বত্বভোগীর কারণে মান বা সতেজতায় কোনো ঘাটতি না থাকে। প্রতিটি চালানে আমরা গুরুত্ব দিই আসল স্বাদ, নিরাপদ সংগ্রহ এবং গ্রাহকের হাতে সর্বোচ্চ মানের আম পৌঁছে দেওয়ায়।',
      },
    ],
  },
  '/contact': {
    eyebrow: 'Support',
    title: 'Contact Us',
    intro: 'Reach Harivanga.com for order updates, delivery coordination, or wholesale questions.',
    highlights: ['WhatsApp for Orders: 01342262821', 'Email: hello@harivanga.com', 'Facebook: Jimbabu123'],
    sections: [
      {
        heading: 'Response time',
        body: 'Support requests are typically handled within business hours, with faster responses for delivery-day issues.',
      },
      {
        heading: 'Wholesale and partnerships',
        body: 'For bulk orders or business collaborations, contact the team with expected quantity, location, and delivery timeline. Order requests can be sent to the WhatsApp number listed above.',
      },
    ],
  },
  '/shipping': {
    eyebrow: 'Policy',
    title: 'Shipping Policy',
    intro: 'Harivanga.com prioritizes fast dispatch and careful handling so ripe fruit arrives in saleable condition.',
    highlights: ['Same-day options in Dhaka', 'Scheduled delivery windows', 'Careful fruit handling'],
    sections: [
      {
        heading: 'Delivery areas',
        body: 'Dhaka orders receive the fastest service. Deliveries outside Dhaka depend on route availability and seasonal volume.',
      },
      {
        heading: 'Packaging',
        body: 'Orders are packed to reduce bruising during transport while maintaining airflow appropriate for fresh produce.',
      },
    ],
  },
  '/returns': {
    eyebrow: 'Policy',
    title: 'Returns & Refunds',
    intro: 'Fresh produce needs a practical return policy. Harivanga.com reviews quality issues quickly and resolves valid claims fairly.',
    highlights: ['Report issues promptly', 'Photo evidence helps', 'Refunds depend on condition review'],
    sections: [
      {
        heading: 'When to report',
        body: 'If fruit arrives damaged or clearly inconsistent with the order, contact support as soon as possible after delivery.',
      },
      {
        heading: 'Resolution options',
        body: 'Depending on the issue, Harivanga.com may offer replacement, partial refund, or account credit.',
      },
    ],
  },
  '/faq': {
    eyebrow: 'Help',
    title: 'Frequently Asked Questions',
    intro: 'Common questions about ripeness, delivery timing, and ordering are collected here for quick reference.',
    highlights: ['Ripeness varies by variety', 'Delivery date can be scheduled', 'Cash and digital payments supported'],
    sections: [
      {
        heading: 'Are the mangoes naturally ripened?',
        body: 'Yes. The storefront messaging and sourcing process are built around naturally ripened seasonal fruit.',
      },
      {
        heading: 'Can I preorder for a specific date?',
        body: 'Yes. The checkout flow already includes a preferred delivery date field for scheduling.',
      },
    ],
  },
  '/privacy': {
    eyebrow: 'Policy',
    title: 'Privacy Policy',
    intro: 'Harivanga.com stores only the customer information needed to manage accounts, deliveries, and order history.',
    highlights: ['Order and address data', 'Supabase-backed auth', 'No unnecessary data collection'],
    sections: [
      {
        heading: 'What data is used',
        body: 'Basic profile details, delivery information, and order history are used to process purchases and improve repeat checkout.',
      },
      {
        heading: 'How access is limited',
        body: 'The app uses authenticated access patterns and role-based admin checks to reduce exposure of user records.',
      },
    ],
  },
};

const PAGE_ICONS = [Leaf, Truck, ShieldCheck, Clock3];
const ABOUT_SECTION_ICONS = [Sprout, SunMedium, Trophy, ShieldCheck];

export const InfoPage: React.FC = () => {
  const { pathname } = useLocation();
  const page = INFO_PAGE_CONTENT[pathname] ?? INFO_PAGE_CONTENT['/about'];
  const isAboutPage = pathname === '/about';

  return (
    <div className={`min-h-screen ${isAboutPage ? 'bg-[radial-gradient(circle_at_top,#fff7eb_0%,#fffdf9_38%,#f7f7f5_100%)]' : 'bg-gray-50'}`}>
      <section className="bg-mango-dark text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-mango-yellow/80">{page.eyebrow}</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black max-w-3xl leading-tight">{page.title}</h1>
          <p className="mt-6 max-w-2xl text-white/75 text-base sm:text-lg leading-relaxed">{page.intro}</p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {page.highlights.map((highlight, index) => {
              const Icon = PAGE_ICONS[index % PAGE_ICONS.length];
              return (
                <div key={highlight} className="rounded-3xl bg-white/10 backdrop-blur-sm px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-mango-orange/20 flex items-center justify-center text-mango-yellow">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-semibold">{highlight}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 [content-visibility:auto] [contain-intrinsic-size:1px_1800px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="space-y-6">
            {page.sections.map((section, index) => {
              const SectionIcon = ABOUT_SECTION_ICONS[index % ABOUT_SECTION_ICONS.length];

              return (
                <article
                  key={section.heading}
                  className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-sm transition duration-300 sm:p-8 ${
                    isAboutPage
                      ? 'border-[#eadfce] bg-[linear-gradient(180deg,#fffaf4_0%,#ffffff_100%)] shadow-[0_18px_45px_rgba(59,31,14,0.08)] hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,31,14,0.12)]'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  {isAboutPage && (
                    <>
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-mango-orange via-[#d29a2f] to-transparent" />
                      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#f8ecdb] blur-2xl transition duration-300 group-hover:scale-110" />
                      <div className="absolute right-5 top-5 text-[4rem] font-black leading-none text-[#f4eadc]">
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                    </>
                  )}

                  <div className="relative z-10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-4">
                        {isAboutPage && (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mango-orange text-white shadow-lg shadow-mango-orange/20">
                            <SectionIcon size={20} />
                          </div>
                        )}
                        <div>
                          {isAboutPage && (
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b27b32]">Section {(index + 1).toString().padStart(2, '0')}</p>
                          )}
                          <h2 className={`mt-1 text-2xl font-black ${isAboutPage ? 'text-[#23170d]' : 'text-mango-dark'}`}>{section.heading}</h2>
                        </div>
                      </div>

                      {isAboutPage && (
                        <span className="inline-flex w-fit rounded-full border border-[#eed8bb] bg-white/80 px-3 py-1 text-xs font-semibold text-[#8f6130]">
                          Harivanga Heritage
                        </span>
                      )}
                    </div>

                    <p className={`mt-5 leading-relaxed ${isAboutPage ? 'text-lg text-[#5a4b3d]' : 'text-gray-600'}`}>{section.body}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <aside
            className={`h-fit rounded-3xl border p-6 shadow-sm sm:p-8 ${
              isAboutPage
                ? 'border-[#eadfce] bg-[linear-gradient(180deg,#fff4e2_0%,#fffaf4_100%)] shadow-[0_18px_45px_rgba(59,31,14,0.08)]'
                : 'border-gray-100 bg-white'
            }`}
          >
            {isAboutPage && (
              <div className="mb-6 rounded-[1.75rem] bg-mango-dark px-5 py-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-mango-yellow/80">From Podaganj</p>
                <p className="mt-3 text-2xl font-black leading-tight">Authentic Harivanga, rooted in Rangpur&apos;s red soil.</p>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  Tree-ripened, chemical-free, and sourced from trusted orchard partners in the Harivanga heartland.
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-mango-orange/10 text-mango-orange flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-mango-dark">Harivanga.com</p>
                <p className="text-sm text-gray-500 mt-1">House 12, Road 5, Dhanmondi, Dhaka, Bangladesh</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                to="/products"
                className="w-full inline-flex items-center justify-between rounded-2xl bg-mango-orange text-white px-5 py-4 font-bold"
              >
                Shop Mangoes
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/account"
                className="w-full inline-flex items-center justify-between rounded-2xl bg-gray-100 text-mango-dark px-5 py-4 font-bold"
              >
                My Account
                <ArrowRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
