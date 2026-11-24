import { EyeOff, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { FeedbackRating } from '../shared/types.ts';

interface FeedbackButtonsProps {
  productId: string;
  currentRating?: FeedbackRating;
  isSubmitting: boolean;
  onSubmitFeedback: (productId: string, rating: FeedbackRating) => void;
}

export function FeedbackButtons({
  productId,
  currentRating,
  isSubmitting,
  onSubmitFeedback,
}: FeedbackButtonsProps) {
  const options: Array<{
    rating: FeedbackRating;
    label: string;
    icon: typeof ThumbsUp;
    activeClass: string;
  }> = [
    {
      rating: 'satisfied',
      label: '만족',
      icon: ThumbsUp,
      activeClass: 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8]',
    },
    {
      rating: 'dissatisfied',
      label: '불만족',
      icon: ThumbsDown,
      activeClass: 'bg-[#FEF2F2] border-[#DC2626] text-[#B91C1C]',
    },
    {
      rating: 'not-interested',
      label: '관심 없음',
      icon: EyeOff,
      activeClass: 'bg-[#F4F4F5] border-[#52525B] text-[#18181B]',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[#71717A] mr-1">추천 피드백:</span>
      {options.map(({ rating, label, icon: Icon, activeClass }) => {
        const isActive = currentRating === rating;
        return (
          <button
            key={rating}
            type="button"
            disabled={isSubmitting}
            onClick={() => onSubmitFeedback(productId, rating)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 ${
              isActive
                ? activeClass
                : 'bg-white border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA] hover:text-[#18181B]'
            }`}
          >
            {isSubmitting && isActive ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            <span>{label}</span>
          </button>
        );
      })}
      {isSubmitting && (
        <span className="text-xs text-[#1D4ED8]">AI 학습 반영 중...</span>
      )}
    </div>
  );
}
