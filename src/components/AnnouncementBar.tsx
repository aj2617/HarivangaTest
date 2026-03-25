import React from 'react';
import { Facebook, MessageCircle, Truck } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-mango-dark text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
            <a
              href="https://wa.me/8801342262821"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <MessageCircle size={14} />
              Phone: 01342262821
            </a>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="inline-flex items-center gap-2">
              <Truck size={14} />
              Estimate delivery 48 hours
            </span>
          </div>

          <a
            href="https://www.facebook.com/Jimbabu123"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-mango-yellow hover:text-white transition-colors"
          >
            <Facebook size={18} />
            Follow on Facebook
          </a>
        </div>
      </div>
    </div>
  );
};
