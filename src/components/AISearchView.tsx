import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DEFAULT_SEARCH_FILTERS,
  DELIVERY_SPEED_OPTIONS,
  PREFERRED_CATEGORY_OPTIONS,
  computeProductPreferenceScore,
  formatKrw,
  formatShippingFee,
  getDeliveryMeta,
  getEstimatedArrivalDateString,
  getHandoffLabel,
  rankProductsByPreference,
} from '../shared/catalog.ts';
import type {
  AISearchResponse,
  AISearchResultItem,
  DeliverySpeed,
  FeedbackRating,
  FeedbackRecord,
  LearnedProfile,
  Product,
  ProductCategory,
  SearchManualFilters,
  UserOnboardingProfile,
} from '../shared/types.ts';
import { FeedbackButtons } from './FeedbackButtons.tsx';
import { ProductImage } from './ProductImage.tsx';
import { StarRating } from './StarRating.tsx';

const SAMPLE_QUERIES = [
  '로우노이즈 무선 기계식 키보드',
  '노이즈캔슬링 헤드폰',
  '에티오피아 예가체프 원두',
  '티타늄 캠핑 플라스크',
  '솔리드 황동 만년필',
];

const PRICE_PRESETS: Array<{ label: string; minPrice?: number; maxPrice?: number }> = [
  { label: '전체 가격', minPrice: undefined, maxPrice: undefined },
  { label: '5만원 이하', minPrice: undefined, maxPrice: 50000 },
  { label: '5만 ~ 15만원', minPrice: 50000, maxPrice: 150000 },
  { label: '15만원 이상', minPrice: 150000, maxPrice: undefined },
];

interface AISearchViewProps {
  query: string;
  onQueryChange: (q: string) => void;
  useProfile: boolean;
  onToggleUseProfile: (val: boolean) => void;
  filters: SearchManualFilters;
  onChangeFilters: (next: SearchManualFilters) => void;
  onExecuteSearch: (
    overrideQuery?: string,
    overrideUseProfile?: boolean,
    overrideFilters?: SearchManualFilters,
    allowBrowseAll?: boolean
  ) => void;
  isSearching: boolean;
  searchError: string | null;
  searchResult: AISearchResponse | null;
  products: Product[];
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  feedbacks: FeedbackRecord[];
  submittingFeedbackProductId: string | null;
  onSubmitFeedback: (
    productId: string,
    rating: FeedbackRating,
    context: 'search' | 'recommendation' | 'external',
    query?: string,
    productName?: string,
    marketplace?: string
  ) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
  onOrderWithRecommendation: (product: Product, rec: AISearchResultItem) => void;
  onGoToProfile: () => void;
}

export function AISearchView({
  query,
  onQueryChange,
  useProfile,
  onToggleUseProfile,
  filters,
  onChangeFilters,
  onExecuteSearch,
  isSearching,
  searchError,
  searchResult,
  products,
  onboarding,
  profile,
  feedbacks,
  submittingFeedbackProductId,
  onSubmitFeedback,
  onSelectProduct,
  onAddToCart,
  onOrderProduct,
  onOrderWithRecommendation,
  onGoToProfile,
}: AISearchViewProps) {
  const priceRangeInvalid =
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice;

  const handleApplyFiltersAndSearch = () => {
    onExecuteSearch(query, useProfile, filters, true);
  };

  const handleResetFilters = () => {
    onChangeFilters(DEFAULT_SEARCH_FILTERS);
    if (query.trim() || searchResult) {
      onExecuteSearch(query, useProfile, DEFAULT_SEARCH_FILTERS, Boolean(searchResult));
    }
  };

  // Also apply client-side manual filtering + initial criteria sorting to external results
  const filteredExternalResults = (searchResult?.externalResults ?? [])
    .filter((ext) => {
      if (filters.freeShippingOnly && ext.isFreeShipping === false) return false;
      if (
        filters.minPrice !== undefined &&
        ext.priceValue !== undefined &&
        ext.priceValue < filters.minPrice
      ) {
        return false;
      }
      if (
        filters.maxPrice !== undefined &&
        ext.priceValue !== undefined &&
        ext.priceValue > filters.maxPrice
      ) {
        return false;
      }
      if (
        filters.minRating > 0 &&
        ext.ratingValue !== undefined &&
        ext.ratingValue < filters.minRating
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'price-asc') {
        return (a.priceValue ?? Number.MAX_SAFE_INTEGER) - (b.priceValue ?? Number.MAX_SAFE_INTEGER);
      }
      if (filters.sortBy === 'rating-desc' || filters.sortBy === 'reviews-desc') {
        return (b.ratingValue ?? 0) - (a.ratingValue ?? 0);
      }
      if (useProfile && filters.sortBy === 'ai-match') {
        if (profile.selectionPriority === 'price') {
          const scoreA =
            (a.isFreeShipping ? 15 : 0) -
            (a.priceValue ?? 150000) / 10000 +
            a.overallMatchScore * 0.4;
          const scoreB =
            (b.isFreeShipping ? 15 : 0) -
            (b.priceValue ?? 150000) / 10000 +
            b.overallMatchScore * 0.4;
          return scoreB - scoreA;
        }
        if (profile.selectionPriority === 'reliability') {
          const scoreA = (a.ratingValue ?? 4.5) * 15 + a.overallMatchScore * 0.5;
          const scoreB = (b.ratingValue ?? 4.5) * 15 + b.overallMatchScore * 0.5;
          return scoreB - scoreA;
        }
        // balanced: favor middle-range price & moderate-to-high rating instead of extremes
        const prices = (searchResult?.externalResults ?? [])
          .map((item) => item.priceValue)
          .filter((v): v is number => typeof v === 'number');
        const midPrice =
          prices.length > 0
            ? (Math.min(...prices) + Math.max(...prices)) / 2
            : 150000;
        const distA = Math.abs((a.priceValue ?? midPrice) - midPrice) / Math.max(1000, midPrice);
        const distB = Math.abs((b.priceValue ?? midPrice) - midPrice) / Math.max(1000, midPrice);
        const balA = (1 - distA) * 50 + (a.ratingValue ?? 4.5) * 8;
        const balB = (1 - distB) * 50 + (b.ratingValue ?? 4.5) * 8;
        return balB - balA;
      }
      return b.overallMatchScore - a.overallMatchScore;
    });

  const normalizedQuery = query.trim().toLowerCase();
  const fillerWords = new Set(['추천', '상품', '해줘', '찾아줘', '인기', '가성비', '좋고', '리뷰', '많은', '또는']);
  const queryTokens = normalizedQuery
    .split(/[\s,·/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !fillerWords.has(t));

  const hasAnyManualFilter =
    filters.category !== '전체' ||
    filters.freeShippingOnly ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating > 0 ||
    filters.deliverySpeed !== 'all' ||
    filters.sortBy !== 'ai-match';

  const shouldShowFilteredCatalog =
    !priceRangeInvalid && (normalizedQuery.length > 0 || hasAnyManualFilter || Boolean(searchResult));

  const filteredCatalog = shouldShowFilteredCatalog
    ? products.filter((p) => {
        if (onboarding.isMinor && p.attributes.isAgeRestricted) return false;
        if (filters.category !== '전체' && p.category !== filters.category) return false;
        if (filters.freeShippingOnly && !p.attributes.isFreeShipping) return false;
        if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
        if (filters.minRating > 0 && p.attributes.sellerRating < filters.minRating) return false;
        if (
          filters.deliverySpeed !== 'all' &&
          !p.supportedDeliveries.includes(filters.deliverySpeed)
        ) {
          return false;
        }
        if (queryTokens.length > 0) {
          const haystack = `${p.name} ${p.brand} ${p.sellerName} ${p.category} ${p.shortSpec} ${p.description} ${p.attributes.origin} ${p.deliveryPeriodLabel}`.toLowerCase();
          return queryTokens.some((token) => haystack.includes(token));
        }
        return true;
      })
    : [];

  const rankParams = {
    selectionPriority: useProfile ? profile.selectionPriority : ('balanced' as const),
    preferredCategories: useProfile ? profile.preferredCategories : [],
    preferredDeliverySpeed: useProfile ? profile.learnedDelivery.preferredSpeed : undefined,
    feedbacks,
    queryTokens,
  };

  const rankedMatchingProducts =
    filteredCatalog.length === 0
      ? []
      : filters.sortBy === 'ai-match'
      ? rankProductsByPreference(filteredCatalog, rankParams)
      : filteredCatalog
          .map((p) => computeProductPreferenceScore(p, rankParams))
          .sort((a, b) => {
            if (filters.sortBy === 'price-asc') {
              return (
                a.product.price +
                a.product.attributes.shippingFee -
                (b.product.price + b.product.attributes.shippingFee)
              );
            }
            if (filters.sortBy === 'rating-desc') {
              return b.product.attributes.sellerRating - a.product.attributes.sellerRating;
            }
            if (filters.sortBy === 'reviews-desc') {
              return b.product.attributes.reviewCount - a.product.attributes.reviewCount;
            }
            return b.fitScore - a.fitScore;
          });

  const sortedAiSearchResults: AISearchResultItem[] = (() => {
    if (!searchResult || searchResult.results.length === 0 || priceRangeInvalid) return [];

    const filteredItems = searchResult.results.filter((rec) => {
      const p = products.find((item) => item.id === rec.productId);
      if (!p) return false;
      if (onboarding.isMinor && p.attributes.isAgeRestricted) return false;
      if (filters.category !== '전체' && p.category !== filters.category) return false;
      if (filters.freeShippingOnly && !p.attributes.isFreeShipping) return false;
      if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
      if (filters.minRating > 0 && p.attributes.sellerRating < filters.minRating) return false;
      if (
        filters.deliverySpeed !== 'all' &&
        !p.supportedDeliveries.includes(filters.deliverySpeed)
      ) {
        return false;
      }
      return true;
    });

    if (filters.sortBy === 'price-asc') {
      return [...filteredItems].sort((a, b) => {
        const pa = products.find((p) => p.id === a.productId);
        const pb = products.find((p) => p.id === b.productId);
        return (
          (pa ? pa.price + pa.attributes.shippingFee : 0) -
          (pb ? pb.price + pb.attributes.shippingFee : 0)
        );
      });
    }
    if (filters.sortBy === 'rating-desc') {
      return [...filteredItems].sort((a, b) => {
        const ra = products.find((p) => p.id === a.productId)?.attributes.sellerRating ?? 0;
        const rb = products.find((p) => p.id === b.productId)?.attributes.sellerRating ?? 0;
        return rb - ra;
      });
    }
    if (filters.sortBy === 'reviews-desc') {
      return [...filteredItems].sort((a, b) => {
        const rva = products.find((p) => p.id === a.productId)?.attributes.reviewCount ?? 0;
        const rvb = products.find((p) => p.id === b.productId)?.attributes.reviewCount ?? 0;
        return rvb - rva;
      });
    }
    if (!useProfile) {
      return [...filteredItems].sort((a, b) => b.overallMatchScore - a.overallMatchScore);
    }
    const matchedProducts = filteredItems
      .map((rec) => products.find((p) => p.id === rec.productId))
      .filter((p): p is Product => Boolean(p));
    const rankedOrder = rankProductsByPreference(matchedProducts, rankParams).map(
      (r) => r.product.id
    );
    return [...filteredItems].sort(
      (a, b) => rankedOrder.indexOf(a.productId) - rankedOrder.indexOf(b.productId)
    );
  })();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <section className="pb-6 border-b border-[#E4E4E7] space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#71717A]">
              AI 맞춤 상품 검색
              <span aria-hidden="true"> · </span>
              누적 주문 {profile.orderCount}건 · 피드백 {profile.feedbackCount}건 반영
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#18181B] tracking-tight mt-1">
              상품 검색 · 수동 상세 필터
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !useProfile;
                onToggleUseProfile(next);
                if (query.trim()) {
                  onExecuteSearch(query, next, filters);
                }
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                useProfile
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                  : 'bg-white border-[#E4E4E7] text-[#52525B] hover:text-[#18181B]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>AI 학습 프로필 반영 {useProfile ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={onGoToProfile}
              className="px-3.5 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              내 설정 수정
            </button>
          </div>
        </div>

        {/* Manual Filter Panel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyFiltersAndSearch();
          }}
          className="p-5 bg-white border border-[#E4E4E7] rounded-xl space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#18181B]">수동 검색 필터 설정</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                검색어·무료배송·가격대·최소 별점·카테고리·배송 방식을 직접 지정해 스토어와 외부 판매처를 함께 필터링합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>필터 초기화</span>
              </button>
              <button
                type="submit"
                disabled={isSearching || priceRangeInvalid}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#93C5FD] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSearching ? '검색 중...' : '필터 적용 검색'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E4E4E7]">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="검색어 입력 (예: 무선 키보드, 무쇠 냄비, 선크림 — 비워두면 선택한 필터 조건 전체 검색)"
              aria-label="필터 내 검색어 입력"
              className="flex-1 px-3 py-2 text-xs text-[#18181B] bg-[#FAFAFA] border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#E4E4E7]">
            {/* Category */}
            <div>
              <label htmlFor="filter-cat" className="block text-xs font-medium text-[#52525B] mb-1">
                카테고리
              </label>
              <select
                id="filter-cat"
                value={filters.category}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    category: e.target.value as '전체' | ProductCategory,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-[#D4D4D8] rounded-lg"
              >
                <option value="전체">전체 카테고리</option>
                {PREFERRED_CATEGORY_OPTIONS.filter(
                  (c) => !(onboarding.isMinor && c.isAgeRestrictedCategory)
                ).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div>
              <label htmlFor="filter-rating" className="block text-xs font-medium text-[#52525B] mb-1">
                판매처 최소 별점
              </label>
              <select
                id="filter-rating"
                value={filters.minRating}
                onChange={(e) =>
                  onChangeFilters({ ...filters, minRating: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-[#D4D4D8] rounded-lg"
              >
                <option value={0}>전체 별점</option>
                <option value={4.0}>4.0점 이상</option>
                <option value={4.5}>4.5점 이상</option>
                <option value={4.8}>4.8점 이상 (최상위 신뢰)</option>
              </select>
            </div>

            {/* Delivery Method */}
            <div>
              <label htmlFor="filter-delivery" className="block text-xs font-medium text-[#52525B] mb-1">
                선호 배송 방식
              </label>
              <select
                id="filter-delivery"
                value={filters.deliverySpeed}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    deliverySpeed: e.target.value as 'all' | DeliverySpeed,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-[#D4D4D8] rounded-lg"
              >
                <option value="all">전체 배송 방식</option>
                {DELIVERY_SPEED_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="filter-sort" className="block text-xs font-medium text-[#52525B] mb-1">
                정렬 기준
              </label>
              <select
                id="filter-sort"
                value={filters.sortBy}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    sortBy: e.target.value as SearchManualFilters['sortBy'],
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-[#D4D4D8] rounded-lg"
              >
                <option value="ai-match">AI 부합도순</option>
                <option value="price-asc">낮은 가격순</option>
                <option value="rating-desc">높은 별점순</option>
                <option value="reviews-desc">리뷰 많은순</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-[#E4E4E7]">
            {/* Price range presets & inputs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#52525B] mr-1">가격대:</span>
              {PRICE_PRESETS.map((preset) => {
                const active =
                  filters.minPrice === preset.minPrice && filters.maxPrice === preset.maxPrice;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChangeFilters({
                        ...filters,
                        minPrice: preset.minPrice,
                        maxPrice: preset.maxPrice,
                      })
                    }
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-[#FAFAFA] text-[#52525B] border-[#E4E4E7] hover:text-[#18181B]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="number"
                  min={0}
                  step={10000}
                  placeholder="최소(원)"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const parsed = val === '' ? undefined : Math.max(0, Math.floor(Number(val)));
                    onChangeFilters({
                      ...filters,
                      minPrice: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
                    });
                  }}
                  className="w-24 px-2.5 py-1 text-xs font-mono bg-white border border-[#D4D4D8] rounded-lg"
                />
                <span className="text-xs text-[#71717A]">~</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  placeholder="최대(원)"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const parsed = val === '' ? undefined : Math.max(0, Math.floor(Number(val)));
                    onChangeFilters({
                      ...filters,
                      maxPrice: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
                    });
                  }}
                  className="w-24 px-2.5 py-1 text-xs font-mono bg-white border border-[#D4D4D8] rounded-lg"
                />
              </div>
            </div>

            {/* Free shipping checkbox */}
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#18181B] cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={filters.freeShippingOnly}
                onChange={(e) =>
                  onChangeFilters({ ...filters, freeShippingOnly: e.target.checked })
                }
                className="w-4 h-4 accent-[#1D4ED8] rounded"
              />
              <span>무료배송 상품만 보기</span>
            </label>
          </div>
          {priceRangeInvalid && (
            <p className="text-xs font-medium text-[#B91C1C]">
              최소 가격이 최대 가격보다 큽니다. 가격 범위를 다시 확인해 주세요.
            </p>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#71717A] mr-1">추천 검색어:</span>
          {SAMPLE_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => {
                onQueryChange(sq);
                onExecuteSearch(sq, useProfile, filters);
              }}
              className="px-3 py-1.5 text-xs text-[#52525B] hover:text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>

        {onboarding.isMinor && (
          <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex items-center gap-2.5 text-xs text-[#92400E]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span>
              미성년자({onboarding.ageGroup}) 계정으로 확인되어 주류·담배 등 성인 전용 물품은 검색 결과에서 자동 제외됩니다.
            </span>
          </div>
        )}
      </section>

      {searchError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-3 text-sm text-[#B91C1C]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{searchError}</span>
        </div>
      )}

      {isSearching && (
        <div className="py-12 text-center bg-white border border-[#E4E4E7] rounded-xl space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#1D4ED8] mx-auto" />
          <p className="text-sm font-medium text-[#18181B]">
            입력한 검색어와 수동 필터 조건에 맞는 상품을 찾고 있습니다
          </p>
        </div>
      )}

      {!isSearching && !searchResult && !shouldShowFilteredCatalog && (
        <div className="p-10 bg-white border border-[#E4E4E7] rounded-xl text-center space-y-2">
          <p className="text-sm font-medium text-[#18181B]">
            상단 검색창에 상품명을 입력하거나 위 수동 필터를 선택한 뒤 &apos;필터 적용 검색&apos;을 눌러보세요.
          </p>
          <p className="text-xs text-[#71717A]">
            선호 카테고리({profile.preferredCategories.join(' · ')})와 {profile.selectionPriorityLabel} 기준이 함께 적용됩니다.
          </p>
        </div>
      )}

      {shouldShowFilteredCatalog && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#18181B]">
                검색어 · 수동 필터 일치 스토어 상품 ({rankedMatchingProducts.length}건)
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                {normalizedQuery ? `'${query.trim()}' 검색어` : '선택한 수동 필터'} 및 초기 설정 기준({profile.selectionPriorityLabel})에 따라 가장 알맞은 상품을 최상단에 정렬했습니다.
              </p>
            </div>
          </div>

          {rankedMatchingProducts.length === 0 ? (
            <div className="p-6 bg-white border border-[#E4E4E7] rounded-xl text-sm text-[#52525B]">
              현재 검색어와 수동 필터 조건에 정확히 일치하는 스토어 상품이 없습니다. 필터를 완화하거나 추천 검색어를 선택해 보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedMatchingProducts.map(({ product, fitScore, fitReason }, idx) => {
                const existingFeedback = feedbacks.find((f) => f.productId === product.id);
                const isTopMatch = idx === 0 && filters.sortBy === 'ai-match';
                return (
                  <article
                    key={product.id}
                    className={`bg-white rounded-xl overflow-hidden flex flex-col justify-between ${
                      isTopMatch ? 'border-2 border-[#1D4ED8] shadow-sm' : 'border border-[#E4E4E7]'
                    }`}
                  >
                    <div>
                      <div
                        onClick={() => onSelectProduct(product)}
                        className="aspect-[4/3] bg-[#F4F4F5] overflow-hidden cursor-pointer relative"
                      >
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full hover:scale-[1.02] transition-transform duration-300"
                        />
                        {isTopMatch && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#1D4ED8] text-white rounded-md shadow-sm">
                              1위 · 설정 기준 최상단
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#71717A]">
                          <span className="truncate">
                            {product.brand} · {product.sellerName}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[#1D4ED8] shrink-0">
                            적합도 {fitScore}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <StarRating
                            rating={product.attributes.sellerRating}
                            reviewCount={product.attributes.reviewCount}
                          />
                          <span
                            className={`text-xs font-medium ${
                              product.attributes.shippingFee === 0
                                ? 'text-[#15803D]'
                                : 'text-[#52525B]'
                            }`}
                          >
                            {formatShippingFee(product.attributes.shippingFee)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h3
                            onClick={() => onSelectProduct(product)}
                            className="text-base font-semibold text-[#18181B] hover:text-[#1D4ED8] cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          <span className="text-sm font-semibold tabular-nums text-[#18181B] shrink-0">
                            {formatKrw(product.price)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#18181B]">
                          배송 기간: {product.deliveryPeriodLabel}
                        </p>
                        <p className="text-xs text-[#52525B] line-clamp-2">{product.shortSpec}</p>
                        <p className="text-[11px] text-[#1D4ED8] line-clamp-1">{fitReason}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-[#E4E4E7] space-y-3">
                      <FeedbackButtons
                        productId={product.id}
                        currentRating={existingFeedback?.rating}
                        isSubmitting={submittingFeedbackProductId === product.id}
                        onSubmitFeedback={(pid, rating) =>
                          onSubmitFeedback(
                            pid,
                            rating,
                            'search',
                            query,
                            product.name,
                            'SUNBYEOL 스토어'
                          )
                        }
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="px-3 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] transition-colors cursor-pointer"
                        >
                          상세
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          className="flex-1 py-2 px-3 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors cursor-pointer"
                        >
                          장바구니
                        </button>
                        <button
                          type="button"
                          onClick={() => onOrderProduct(product)}
                          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                        >
                          배송 지정 주문
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!isSearching && searchResult && (
        <div className="space-y-10">
          <div className="p-5 bg-[#F8FAFC] border border-[#DBEAFE] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-[#1D4ED8]">
                AI 검색 해석 · {searchResult.usedProfile ? '개인화 학습 반영 결과' : '일반 검색 결과'}
              </span>
              <span className="font-mono tabular-nums text-[#52525B]">
                외부 판매처 {filteredExternalResults.length}건 · 스토어 {sortedAiSearchResults.length}건
              </span>
            </div>
            <p className="text-sm text-[#18181B] leading-relaxed">{searchResult.interpretation}</p>
          </div>

          {/* 1. External Multi-Marketplace Results */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1D4ED8]" />
                <h2 className="text-lg font-semibold text-[#18181B]">
                  외부 판매처 검색 결과
                </h2>
              </div>
              <span className="text-xs text-[#71717A]">실시간 웹 검색 + 수동 필터 적용</span>
            </div>

            {filteredExternalResults.length === 0 ? (
              <div className="p-6 bg-white border border-[#E4E4E7] rounded-xl text-sm text-[#52525B] space-y-1.5">
                {searchResult.externalSearchNotice ? (
                  <>
                    <p className="font-medium text-[#52525B]">
                      {searchResult.externalSearchNotice}
                    </p>
                    <p className="text-xs text-[#71717A]">
                      아래 SUNBYEOL 스토어 수동 필터 · 맞춤 검색 결과는 정상적으로 반영되었습니다.
                    </p>
                  </>
                ) : (
                  <p>
                    선택한 검색어 및 수동 필터 조건에 맞는 외부 판매처 결과를 찾지 못했습니다. 필터 조건을 조금 넓혀서 다시 시도해 보세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredExternalResults.map((ext, idx) => {
                  const existingFeedback = feedbacks.find(
                    (f) => f.productId === ext.id || f.productName === ext.title
                  );
                  return (
                    <article
                      key={ext.id}
                      className={`bg-white rounded-xl p-6 flex flex-col justify-between gap-4 ${
                        idx === 0 ? 'border-2 border-[#1D4ED8] shadow-sm' : 'border border-[#E4E4E7]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-[#71717A] flex-wrap">
                            {idx === 0 && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#1D4ED8] text-white rounded">
                                1위 · 기준 최상단
                              </span>
                            )}
                            <span className="font-mono font-semibold text-[#18181B]">
                              0{idx + 1}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#1D4ED8]">{ext.marketplace}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ext.category}</span>
                          </div>
                          <span className="font-mono tabular-nums font-semibold text-[#18181B] shrink-0">
                            부합도 {ext.overallMatchScore}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          {ext.ratingValue !== undefined ? (
                            <StarRating compact rating={ext.ratingValue} />
                          ) : (
                            <span className="text-[#71717A]">판매처 평점 정보 확인</span>
                          )}
                          <span
                            className={`font-medium ${
                              ext.isFreeShipping ? 'text-[#15803D]' : 'text-[#52525B]'
                            }`}
                          >
                            {ext.isFreeShipping === true
                              ? '무료배송'
                              : ext.isFreeShipping === false
                              ? '배송비 별도(판매처 기준)'
                              : '배송 조건 판매처 확인'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-base font-semibold text-[#18181B] leading-snug">
                            {ext.title}
                          </h3>
                          <span className="text-base font-semibold tabular-nums text-[#18181B] whitespace-nowrap shrink-0">
                            {ext.priceText}
                          </span>
                        </div>

                        <div className="text-xs text-[#52525B] space-y-1 pt-2 border-t border-[#E4E4E7]">
                          <p>
                            <span className="text-[#71717A]">판매처 신뢰성: </span>
                            <span className="font-medium text-[#18181B]">{ext.sellerTrustSummary}</span>
                          </p>
                          <p>
                            <span className="text-[#71717A]">배송 안내: </span>
                            <span className="font-medium text-[#18181B]">{ext.deliverySummary}</span>
                          </p>
                        </div>

                        <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg space-y-1.5 text-xs">
                          <p className="text-[#18181B] leading-relaxed">
                            <span className="font-semibold text-[#1D4ED8]">선택 기준 부합: </span>
                            {ext.criteriaFitReason}
                          </p>
                          <p className="text-[#52525B] leading-relaxed">
                            <span className="font-semibold text-[#18181B]">배송 방식 부합: </span>
                            {ext.deliveryFitReason}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E4E4E7] flex flex-col gap-3">
                        <FeedbackButtons
                          productId={ext.id}
                          currentRating={existingFeedback?.rating}
                          isSubmitting={submittingFeedbackProductId === ext.id}
                          onSubmitFeedback={(pid, rating) =>
                            onSubmitFeedback(
                              pid,
                              rating,
                              'external',
                              searchResult.query,
                              ext.title,
                              ext.marketplace
                            )
                          }
                        />

                        {ext.productUrl && (
                          <a
                            href={ext.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors"
                          >
                            <span>{ext.marketplace} 판매 페이지 확인하기</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {searchResult.groundingSources.length > 0 && (
              <div className="p-4 bg-white border border-[#E4E4E7] rounded-xl space-y-2">
                <p className="text-xs font-semibold text-[#52525B]">확인된 외부 판매처 검색 출처</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  {searchResult.groundingSources.map((src, i) => (
                    <a
                      key={`${src.uri}-${i}`}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1D4ED8] hover:underline"
                    >
                      <span className="truncate max-w-[260px]">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 2. Internal Curated Store Matches */}
          {sortedAiSearchResults.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-[#E4E4E7]">
              <h2 className="text-lg font-semibold text-[#18181B]">
                SUNBYEOL 스토어 필터링 · 바로 주문 가능 상품 ({sortedAiSearchResults.length}건)
              </h2>

              <div className="space-y-6">
                {sortedAiSearchResults.map((rec, index) => {
                  const product = products.find((p) => p.id === rec.productId);
                  if (!product) return null;

                  const deliveryMeta = getDeliveryMeta(rec.recommendedDeliverySpeed);
                  const etaText = getEstimatedArrivalDateString(rec.recommendedDeliverySpeed);
                  const existingFeedback = feedbacks.find((f) => f.productId === product.id);
                  const blockedForMinor = onboarding.isMinor && product.attributes.isAgeRestricted;

                  return (
                    <article
                      key={product.id}
                      className={`bg-white rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 ${
                        index === 0 ? 'border-2 border-[#1D4ED8] shadow-sm' : 'border border-[#E4E4E7]'
                      }`}
                    >
                      <div className="lg:col-span-4 bg-[#F4F4F5] aspect-[4/3] lg:aspect-auto relative">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full cursor-pointer"
                        />
                        {index === 0 && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#1D4ED8] text-white rounded-md shadow-sm">
                              1위 · 설정 기준 최상단
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-5">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                              <span className="font-mono font-semibold text-[#18181B]">
                                0{index + 1}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-[#18181B]">{product.sellerName}</span>
                              <span aria-hidden="true">·</span>
                              <span>{product.deliveryPeriodLabel}</span>
                              <span aria-hidden="true">·</span>
                              <StarRating
                                rating={product.attributes.sellerRating}
                                reviewCount={product.attributes.reviewCount}
                              />
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                              <span
                                className={`font-sans font-medium ${
                                  product.attributes.shippingFee === 0
                                    ? 'text-[#15803D]'
                                    : 'text-[#52525B]'
                                }`}
                              >
                                {formatShippingFee(product.attributes.shippingFee)}
                              </span>
                              <span className="font-semibold text-[#1D4ED8]">
                                종합 부합도 {rec.overallMatchScore}%
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                            <h3
                              onClick={() => onSelectProduct(product)}
                              className="text-xl font-semibold text-[#18181B] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                            >
                              {product.name}
                            </h3>
                            <span className="text-lg font-semibold tabular-nums text-[#18181B] shrink-0">
                              {formatKrw(product.price)}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-[#1D4ED8]">{rec.matchHeadline}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E4E4E7] text-xs">
                            <div>
                              <p className="font-semibold text-[#18181B] mb-1">카테고리 · 선택 기준 부합</p>
                              <p className="text-[#52525B] leading-relaxed">{rec.requirementFitReason}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-[#18181B] mb-1">선호 배송 방식 부합</p>
                              <p className="text-[#52525B] leading-relaxed">{rec.deliveryFitReason}</p>
                            </div>
                          </div>

                          <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-xs text-[#52525B] space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#18181B] font-medium">
                              <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                              <span>AI 추천 배송: {deliveryMeta.label}</span>
                              <span aria-hidden="true">·</span>
                              <span>{deliveryMeta.carrier}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{deliveryMeta.extraFeeLabel}</span>
                            </div>
                            <p className="pl-5 text-[#71717A]">
                              예상 도착: {etaText} · {getHandoffLabel(rec.recommendedHandoff)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#E4E4E7] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <FeedbackButtons
                            productId={product.id}
                            currentRating={existingFeedback?.rating}
                            isSubmitting={submittingFeedbackProductId === product.id}
                            onSubmitFeedback={(pid, rating) =>
                              onSubmitFeedback(
                                pid,
                                rating,
                                'search',
                                searchResult.query,
                                product.name,
                                'SUNBYEOL 스토어'
                              )
                            }
                          />

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onSelectProduct(product)}
                              className="px-3.5 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] transition-colors cursor-pointer"
                            >
                              상세 보기
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(blockedForMinor)}
                              onClick={() => onAddToCart(product)}
                              className="px-3.5 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                            >
                              장바구니
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(blockedForMinor)}
                              onClick={() => onOrderWithRecommendation(product, rec)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] rounded-lg transition-colors cursor-pointer"
                            >
                              <span>{blockedForMinor ? '미성년자 구매 제한' : '추천 배송으로 주문'}</span>
                              {!blockedForMinor && <ArrowRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
