const LOCAL_IMAGE_PREFIX = '/images/downloaded/';

export const getThumbnailImageSrc = (src: string): string => {
  if (!src.startsWith(LOCAL_IMAGE_PREFIX)) {
    return src;
  }

  return src.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '-thumb.$1');
};
