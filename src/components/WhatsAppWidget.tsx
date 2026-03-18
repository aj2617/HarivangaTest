import React from 'react';
import { useLocation } from 'react-router-dom';

type WhatsAppWidgetProps = {
  message?: string;
};

const DEFAULT_MESSAGE = 'Hello! I would like to place an order.';

const WhatsAppGlyph: React.FC = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[58%] w-[58%] fill-current">
    <path d="M19.11 17.33c-.29-.15-1.7-.84-1.96-.94-.26-.09-.45-.14-.64.15-.19.28-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.15-1.21-.45-2.31-1.43-.85-.76-1.43-1.7-1.6-1.98-.17-.29-.02-.44.13-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.09-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.47-.64-.48h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-.99 2.43 0 1.43 1.03 2.81 1.18 3 .14.19 2.03 3.1 4.91 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33Z" />
    <path d="M16.01 3.2a12.7 12.7 0 0 0-10.97 19.1L3.2 28.8l6.66-1.74a12.8 12.8 0 1 0 6.15-23.86Zm0 22.98c-2 0-3.96-.54-5.68-1.57l-.41-.24-3.95 1.03 1.05-3.85-.27-.4a10.6 10.6 0 1 1 9.26 5.03Z" />
  </svg>
);

export const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({ message = DEFAULT_MESSAGE }) => {
  const { pathname } = useLocation();
  const href = `https://wa.me/8801307367441?text=${encodeURIComponent(message)}`;

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 sm:bottom-5 sm:right-5 sm:gap-3"
    >
      <div className="hidden sm:flex items-center rounded-full bg-[#25D366] px-5 py-3 text-white shadow-[0_14px_30px_rgba(37,211,102,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,211,102,0.34)]">
        <span className="text-base font-black leading-none lg:text-lg">Chat on WhatsApp</span>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 p-[5px] shadow-[0_14px_34px_rgba(37,211,102,0.32)] backdrop-blur sm:h-[72px] sm:w-[72px]">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#25D366] text-white ring-2 ring-[#dcfce7]">
          <WhatsAppGlyph />
        </div>
      </div>
    </a>
  );
};
