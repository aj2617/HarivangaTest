import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowRight, Clock3, Leaf, MapPin, ShieldCheck, Truck } from 'lucide-react';

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
    eyebrow: 'About Harivanga.com',
    title: 'Our Story',
    intro: 'Harivanga.com connects customers directly with trusted orchards in Rajshahi and Chapainawabganj so fresh mangoes reach homes quickly and in peak condition.',
    highlights: ['Direct orchard sourcing', 'Naturally ripened fruit', 'Reliable Dhaka delivery'],
    sections: [
      {
        heading: 'How we source',
        body: 'We work with growers who follow seasonal harvesting schedules and avoid harmful ripening shortcuts. Each batch is selected for taste, texture, and transport readiness.'
      },
      {
        heading: 'Why customers choose us',
        body: 'The focus is simple: consistent quality, honest pricing, and clear order communication from checkout through delivery.'
      }
    ]
  },
  '/contact': {
    eyebrow: 'Support',
    title: 'Contact Us',
    intro: 'Reach Harivanga.com for order updates, delivery coordination, or wholesale questions.',
    highlights: ['WhatsApp for Orders: +880 1307-367441', 'Email: hello@harivanga.com', 'Facebook: Jimbabu123'],
    sections: [
      {
        heading: 'Response time',
        body: 'Support requests are typically handled within business hours, with faster responses for delivery-day issues.'
      },
      {
        heading: 'Wholesale and partnerships',
        body: 'For bulk orders or business collaborations, contact the team with expected quantity, location, and delivery timeline. Order requests can be sent to the WhatsApp number listed above.'
      }
    ]
  },
  '/shipping': {
    eyebrow: 'Policy',
    title: 'Shipping Policy',
    intro: 'Harivanga.com prioritizes fast dispatch and careful handling so ripe fruit arrives in saleable condition.',
    highlights: ['Same-day options in Dhaka', 'Scheduled delivery windows', 'Careful fruit handling'],
    sections: [
      {
        heading: 'Delivery areas',
        body: 'Dhaka orders receive the fastest service. Deliveries outside Dhaka depend on route availability and seasonal volume.'
      },
      {
        heading: 'Packaging',
        body: 'Orders are packed to reduce bruising during transport while maintaining airflow appropriate for fresh produce.'
      }
    ]
  },
  '/returns': {
    eyebrow: 'Policy',
    title: 'Returns & Refunds',
    intro: 'Fresh produce needs a practical return policy. Harivanga.com reviews quality issues quickly and resolves valid claims fairly.',
    highlights: ['Report issues promptly', 'Photo evidence helps', 'Refunds depend on condition review'],
    sections: [
      {
        heading: 'When to report',
        body: 'If fruit arrives damaged or clearly inconsistent with the order, contact support as soon as possible after delivery.'
      },
      {
        heading: 'Resolution options',
        body: 'Depending on the issue, Harivanga.com may offer replacement, partial refund, or account credit.'
      }
    ]
  },
  '/faq': {
    eyebrow: 'Help',
    title: 'Frequently Asked Questions',
    intro: 'Common questions about ripeness, delivery timing, and ordering are collected here for quick reference.',
    highlights: ['Ripeness varies by variety', 'Delivery date can be scheduled', 'Cash and digital payments supported'],
    sections: [
      {
        heading: 'Are the mangoes naturally ripened?',
        body: 'Yes. The storefront messaging and sourcing process are built around naturally ripened seasonal fruit.'
      },
      {
        heading: 'Can I preorder for a specific date?',
        body: 'Yes. The checkout flow already includes a preferred delivery date field for scheduling.'
      }
    ]
  },
  '/privacy': {
    eyebrow: 'Policy',
    title: 'Privacy Policy',
    intro: 'Harivanga.com stores only the customer information needed to manage accounts, deliveries, and order history.',
    highlights: ['Order and address data', 'Firebase-backed auth', 'No unnecessary data collection'],
    sections: [
      {
        heading: 'What data is used',
        body: 'Basic profile details, delivery information, and order history are used to process purchases and improve repeat checkout.'
      },
      {
        heading: 'How access is limited',
        body: 'The app uses authenticated access patterns and role-based admin checks to reduce exposure of user records.'
      }
    ]
  }
};

const PAGE_ICONS = [Leaf, Truck, ShieldCheck, Clock3];

export const InfoPage: React.FC = () => {
  const { pathname } = useLocation();
  const page = INFO_PAGE_CONTENT[pathname] ?? INFO_PAGE_CONTENT['/about'];

  return (
    <div className="min-h-screen bg-gray-50">
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

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="space-y-6">
            {page.sections.map((section) => (
              <article key={section.heading} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-black text-mango-dark">{section.heading}</h2>
                <p className="mt-4 text-gray-600 leading-relaxed">{section.body}</p>
              </article>
            ))}
          </div>

          <aside className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 h-fit">
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
