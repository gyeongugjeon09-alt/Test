import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F4F4F5] text-[#71717A] p-6 text-center ${className}`}
      >
        <Package className="w-8 h-8 mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium text-[#52525B] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
