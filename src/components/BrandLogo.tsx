import React from 'react';
import logoImage from '../../logo.png';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
  showDotComBelow?: boolean;
};

const SIZE_CLASSES = {
  sm: {
    wrap: 'gap-1.5',
    icon: 'h-8 w-8',
    name: 'text-xl',
    dotCom: 'text-xs -mt-1',
  },
  md: {
    wrap: 'gap-1.5',
    icon: 'h-10 w-10',
    name: 'text-2xl',
    dotCom: 'text-sm -mt-1',
  },
  lg: {
    wrap: 'gap-2',
    icon: 'h-12 w-12',
    name: 'text-3xl',
    dotCom: 'text-base -mt-1',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  dark = true,
  showDotComBelow = false,
}) => {
  const classes = SIZE_CLASSES[size];
  const textColor = dark ? 'text-mango-dark' : 'text-white';
  const dotComColor = dark ? 'text-mango-dark/90' : 'text-white/90';

  return (
    <div className={`flex items-center ${classes.wrap}`}>
      <img
        src={logoImage}
        alt="Harivanga logo"
        aria-hidden="true"
        className={`${classes.icon} shrink-0 object-contain`}
      />

      <div className={showDotComBelow ? 'leading-none' : 'flex items-baseline gap-0.5 leading-none'}>
        <div className={`font-black tracking-tight ${classes.name} ${textColor}`}>Harivanga</div>
        <div className={`font-black ${showDotComBelow ? `text-right ${classes.dotCom}` : classes.dotCom} ${dotComColor}`}>
          .com
        </div>
      </div>
    </div>
  );
};
