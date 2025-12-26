import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallback?: React.ReactNode;
  showSkeleton?: boolean;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallback,
  showSkeleton = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoading(false);
      setIsError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsError(true);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    if (img.complete) {
      handleLoad();
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  if (isError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-600" />
        </div>
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />

      {isError && !fallback && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
      )}
    </div>
  );
};

export default Image;
