import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  compact?: boolean;
}

export function StarRating({ rating, reviewCount, compact = false }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.4;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      aria-label={`별점 ${clamped.toFixed(1)}점`}
    >
      {!compact ? (
        <span className="inline-flex items-center gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((idx) => {
            const filled = idx < fullStars || (idx === fullStars && hasHalf);
            return (
              <Star
                key={idx}
                className={`w-3.5 h-3.5 ${
                  filled
                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                    : 'fill-[#E4E4E7] text-[#D4D4D8]'
                }`}
              />
            );
          })}
        </span>
      ) : (
        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden="true" />
      )}
      <span className="font-mono tabular-nums font-semibold text-[#18181B]">
        {clamped.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-[#71717A] tabular-nums">({reviewCount.toLocaleString()})</span>
      )}
    </span>
  );
}
