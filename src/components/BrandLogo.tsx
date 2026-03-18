import React from 'react';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
  showDotComBelow?: boolean;
};

const SIZE_CLASSES = {
  sm: {
    wrap: 'gap-2',
    icon: 'h-8 w-8',
    name: 'text-xl',
    dotCom: 'text-xs -mt-1',
  },
  md: {
    wrap: 'gap-3',
    icon: 'h-10 w-10',
    name: 'text-2xl',
    dotCom: 'text-sm -mt-1',
  },
  lg: {
    wrap: 'gap-3',
    icon: 'h-12 w-12',
    name: 'text-3xl',
    dotCom: 'text-base -mt-1',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  dark = true,
  showDotComBelow = true,
}) => {
  const classes = SIZE_CLASSES[size];
  const textColor = dark ? 'text-mango-dark' : 'text-white';
  const dotComColor = dark ? 'text-mango-dark/90' : 'text-white/90';

  return (
    <div className={`flex items-center ${classes.wrap}`}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className={`${classes.icon} shrink-0 drop-shadow-sm`}
      >
        <defs>
          <linearGradient id="harivanga-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8ef57" />
            <stop offset="55%" stopColor="#7ab516" />
            <stop offset="100%" stopColor="#256d14" />
          </linearGradient>
          <linearGradient id="harivanga-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd36a" />
            <stop offset="100%" stopColor="#ef8f00" />
          </linearGradient>
        </defs>

        <path
          d="M29 6c-8 3-16 12-20 22-4 11-3 24 5 31 6 6 15 7 22 3 7-5 10-13 13-20 3-8 6-16 4-25C51 8 40 3 29 6Z"
          fill="url(#harivanga-body)"
          stroke="#175d18"
          strokeWidth="1.8"
        />
        <path
          d="M13 34c-3 7-3 16 2 22 4 5 10 8 17 8-6 2-13 1-18-4-8-7-9-20-5-31 4-10 12-19 20-22-5 4-11 12-16 27Z"
          fill="url(#harivanga-edge)"
          opacity="0.95"
        />
        <path
          d="M25 5c3-2 8-2 13 0 5 2 10 5 14 5-4 3-10 4-16 3-6-1-9-4-11-8Z"
          fill="#4e9b1b"
        />
        <path
          d="M32 8c-5-5-13-6-20-3 5 1 10 3 15 7 2 1 4 1 5-1Z"
          fill="#69bf18"
          stroke="#175d18"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42 6c2-2 4-4 7-4 2 0 4 1 5 3-3 1-5 4-7 7"
          fill="none"
          stroke="#6d3c10"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="22" cy="22" rx="7" ry="11" fill="#fff7aa" opacity="0.35" transform="rotate(28 22 22)" />
      </svg>

      <div className="leading-none">
        <div className={`font-black tracking-tight ${classes.name} ${textColor}`}>Harivanga</div>
        {showDotComBelow && (
          <div className={`font-black text-right ${classes.dotCom} ${dotComColor}`}>.com</div>
        )}
      </div>
    </div>
  );
};
