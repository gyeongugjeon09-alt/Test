import { PREFERRED_CATEGORY_OPTIONS, SELECTION_PRIORITY_OPTIONS } from '../shared/catalog.ts';
import type { PreferredProductCategory, SelectionPriority } from '../shared/types.ts';

interface RequirementCriteriaSelectorProps {
  selectedCategories: PreferredProductCategory[];
  onChangeCategories: (categories: PreferredProductCategory[]) => void;
  selectionPriority: SelectionPriority;
  onChangeSelectionPriority: (priority: SelectionPriority) => void;
  isMinor?: boolean;
}

export function RequirementCriteriaSelector({
  selectedCategories,
  onChangeCategories,
  selectionPriority,
  onChangeSelectionPriority,
  isMinor = false,
}: RequirementCriteriaSelectorProps) {
  const availableCategories = isMinor
    ? PREFERRED_CATEGORY_OPTIONS.filter((c) => !c.isAgeRestrictedCategory)
    : PREFERRED_CATEGORY_OPTIONS;

  const toggleCategory = (cat: PreferredProductCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return;
      onChangeCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      onChangeCategories([...selectedCategories, cat]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Diverse Preferred Categories with Accurate Examples */}
      <div className="space-y-2.5">
        <div>
          <p className="text-xs font-semibold text-[#18181B]">
            1단계. 선호하는 상품 카테고리를 선택하세요 (복수 선택)
          </p>
          <p className="text-xs text-[#71717A] mt-0.5">
            {isMinor
              ? '미성년자(만 19세 미만) 계정은 주류 등 성인 전용 카테고리가 자동으로 제외됩니다.'
              : '다양한 품목군 중 주로 탐색하려는 카테고리를 선택하면 AI가 해당 기준으로 추천을 최적화합니다.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {availableCategories.map((cat) => {
            const active = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`p-3.5 text-left rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'border-[#18181B] bg-[#18181B] text-white'
                    : 'border-[#E4E4E7] bg-white text-[#18181B] hover:border-[#A1A1AA]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{cat.label}</p>
                  {cat.isAgeRestrictedCategory && (
                    <span
                      className={`text-[11px] font-medium ${
                        active ? 'text-amber-300' : 'text-[#B45309]'
                      }`}
                    >
                      19세 이상
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 leading-relaxed ${
                    active ? 'text-white/80' : 'text-[#71717A]'
                  }`}
                >
                  예시: {cat.examples}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Price vs Seller Reliability Priority */}
      <div className="space-y-2.5 pt-4 border-t border-[#E4E4E7]">
        <div>
          <p className="text-xs font-semibold text-[#18181B]">
            2단계. 선택한 카테고리에서 상품을 찾을 때 어떤 기준을 우선할까요?
          </p>
          <p className="text-xs text-[#71717A] mt-0.5">
            상품을 선별할 때 가격과 판매처 신뢰성(리뷰·별점) 중 어떤 기준을 우선할지 결정합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {SELECTION_PRIORITY_OPTIONS.map((opt) => {
            const active = selectionPriority === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSelectionPriority(opt.id)}
                className={`p-3.5 text-left rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                  active
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]/60'
                    : 'border-[#E4E4E7] bg-white hover:border-[#A1A1AA]'
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    active ? 'text-[#1D4ED8]' : 'text-[#18181B]'
                  }`}
                >
                  {opt.shortLabel}
                </p>
                <p className="text-xs text-[#52525B] leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
