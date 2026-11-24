import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  MessageSquarePlus,
  Minus,
  Plus,
  ShieldAlert,
  Star,
  ThumbsUp,
} from 'lucide-react';
import {
  formatKrw,
  formatShippingFee,
  getDeliverySpeedLabel,
  getHandoffLabel,
  getSameModelOffers,
} from '../shared/catalog.ts';
import {
  getProductDetailContent,
  getProductRatingStats,
  getProductReviews,
} from '../shared/reviews.ts';
import type { FeedbackRating, FeedbackRecord, Product, ProductReview } from '../shared/types.ts';
import { FeedbackButtons } from './FeedbackButtons.tsx';
import { ProductImage } from './ProductImage.tsx';
import { StarRating } from './StarRating.tsx';

interface ProductDetailPageProps {
  product: Product;
  isMinor?: boolean;
  userReviews: ProductReview[];
  feedbacks: FeedbackRecord[];
  submittingFeedbackProductId: string | null;
  onBack: () => void;
  onSelectCategory?: (category: Product['category']) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOrderNow: (product: Product, quantity: number) => void;
  onSubmitFeedback: (
    productId: string,
    rating: FeedbackRating,
    context: 'recommendation' | 'search' | 'external',
    query?: string,
    productName?: string,
    marketplace?: string
  ) => void;
  onReviewCreated: (reviews: ProductReview[]) => void;
}

type ReviewFilter = 'all' | '5' | '4' | '3-or-less' | 'verified';
type ReviewSort = 'latest' | 'rating-desc' | 'rating-asc' | 'helpful-desc';

export function ProductDetailPage({
  product,
  isMinor = false,
  userReviews,
  feedbacks,
  submittingFeedbackProductId,
  onBack,
  onSelectCategory,
  onAddToCart,
  onOrderNow,
  onSubmitFeedback,
  onReviewCreated,
}: ProductDetailPageProps) {
  const [activeProduct, setActiveProduct] = useState<Product>(product);
  const [quantity, setQuantity] = useState(1);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [reviewSort, setReviewSort] = useState<ReviewSort>('latest');
  const [helpfulIds, setHelpfulIds] = useState<Record<string, boolean>>({});

  // Review composer state
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newRating, setNewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [newDeliveryRating, setNewDeliveryRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedPros, setSelectedPros] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    setActiveProduct(product);
    setQuantity(1);
    setReviewFilter('all');
    setReviewSort('latest');
    setIsWritingReview(false);
    setReviewError(null);
    setReviewSuccess(null);
  }, [product]);

  const blockedForMinor = isMinor && Boolean(activeProduct.attributes.isAgeRestricted);
  const sameModelOffers = useMemo(
    () => getSameModelOffers(activeProduct.id),
    [activeProduct.id]
  );
  const detailContent = useMemo(() => getProductDetailContent(activeProduct), [activeProduct]);
  const allReviews = useMemo(
    () => getProductReviews(activeProduct, userReviews),
    [activeProduct, userReviews]
  );
  const userReviewCountForProduct = useMemo(
    () => userReviews.filter((r) => r.productId === activeProduct.id).length,
    [userReviews, activeProduct.id]
  );
  const stats = useMemo(
    () => getProductRatingStats(activeProduct, allReviews, userReviewCountForProduct),
    [activeProduct, allReviews, userReviewCountForProduct]
  );

  const filteredReviews = useMemo(() => {
    const base = allReviews.filter((rev) => {
      if (reviewFilter === '5') return rev.rating === 5;
      if (reviewFilter === '4') return rev.rating === 4;
      if (reviewFilter === '3-or-less') return rev.rating <= 3;
      if (reviewFilter === 'verified') return rev.verifiedPurchase;
      return true;
    });

    return [...base].sort((a, b) => {
      if (reviewSort === 'rating-desc') return b.rating - a.rating;
      if (reviewSort === 'rating-asc') return a.rating - b.rating;
      if (reviewSort === 'helpful-desc') {
        const ha = a.helpfulCount + (helpfulIds[a.id] ? 1 : 0);
        const hb = b.helpfulCount + (helpfulIds[b.id] ? 1 : 0);
        return hb - ha;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [allReviews, reviewFilter, reviewSort, helpfulIds]);

  const existingFeedback = feedbacks.find((f) => f.productId === activeProduct.id);
  const proTagChoices = [
    ...activeProduct.attributes.highlights.slice(0, 2),
    activeProduct.deliveryPeriodLabel,
    activeProduct.attributes.shippingFee === 0 ? '무료배송 만족' : '포장 꼼꼼함',
  ];

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTogglePro = (tag: string) => {
    setSelectedPros((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag].slice(0, 4)
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setReviewError('평가 제목과 상세 후기 내용을 입력해 주세요.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(activeProduct.id)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          deliveryRating: newDeliveryRating,
          title: newTitle.trim(),
          content: newContent.trim(),
          pros: selectedPros,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '상품 평가 등록에 실패했습니다.');
      }
      onReviewCreated(data.reviews as ProductReview[]);
      setNewTitle('');
      setNewContent('');
      setSelectedPros([]);
      setNewRating(5);
      setNewDeliveryRating(5);
      setIsWritingReview(false);
      setReviewFilter('all');
      setReviewSort('latest');
      setReviewSuccess('상품 평가가 등록되어 상단에 반영되었습니다.');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : '상품 평가 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-10">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E4E7]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18181B] hover:text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전 목록으로 돌아가기</span>
        </button>

        <nav
          aria-label="상품 위치 경로"
          className="flex items-center gap-1.5 text-xs text-[#71717A] min-w-0"
        >
          <button
            type="button"
            onClick={onBack}
            className="hover:text-[#18181B] transition-colors cursor-pointer shrink-0"
          >
            스토어
          </button>
          <span aria-hidden="true">·</span>
          {onSelectCategory ? (
            <button
              type="button"
              onClick={() => onSelectCategory(activeProduct.category)}
              className="hover:text-[#18181B] transition-colors cursor-pointer truncate"
            >
              {activeProduct.category}
            </button>
          ) : (
            <span className="truncate">{activeProduct.category}</span>
          )}
          <span aria-hidden="true">·</span>
          <span className="text-[#18181B] font-medium truncate">{activeProduct.name}</span>
        </nav>
      </div>

      {/* Section 1: Gallery + Contiguous Purchase Module */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left: Product Image & Seller Trust Strip */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/3] bg-[#F4F4F5] rounded-xl overflow-hidden border border-[#E4E4E7]">
            <ProductImage
              src={activeProduct.image}
              alt={activeProduct.name}
              className="w-full h-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-lg">
              <p className="text-[#71717A]">판매처</p>
              <p className="font-semibold text-[#18181B] mt-1 truncate">
                {activeProduct.sellerName}
              </p>
              <p className="text-[11px] text-[#52525B] mt-0.5">
                {activeProduct.attributes.isOfficialSeller ? '공식 인증 스토어' : '입점 파트너 셀러'}
              </p>
            </div>
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-lg">
              <p className="text-[#71717A]">평균 평점</p>
              <p className="font-mono tabular-nums font-semibold text-[#18181B] mt-1">
                {stats.averageRating.toFixed(1)} / 5.0
              </p>
              <p className="text-[11px] text-[#52525B] mt-0.5 tabular-nums">
                누적 평가 {stats.totalReviewCount.toLocaleString()}건
              </p>
            </div>
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-lg">
              <p className="text-[#71717A]">예상 배송</p>
              <p className="font-semibold text-[#18181B] mt-1 truncate">
                {activeProduct.deliveryPeriodLabel}
              </p>
              <p
                className={`text-[11px] mt-0.5 font-medium ${
                  activeProduct.attributes.shippingFee === 0
                    ? 'text-[#15803D]'
                    : 'text-[#52525B]'
                }`}
              >
                {formatShippingFee(activeProduct.attributes.shippingFee)}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 bg-white border border-[#E4E4E7] rounded-xl p-6 md:p-7 space-y-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
              <span className="font-medium text-[#18181B]">{activeProduct.brand}</span>
              <span aria-hidden="true">·</span>
              <span>{activeProduct.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#1D4ED8] font-medium">{activeProduct.stockStatus}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-[#18181B] tracking-tight leading-snug text-balance">
              {activeProduct.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <StarRating
                rating={stats.averageRating}
                reviewCount={stats.totalReviewCount}
              />
              <button
                type="button"
                onClick={() => scrollToSection('product-reviews')}
                className="text-xs font-medium text-[#1D4ED8] hover:underline cursor-pointer"
              >
                상품 평가 {allReviews.length}건 상세 보기
              </button>
            </div>
          </div>

          <div className="py-4 border-y border-[#E4E4E7] flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <span className="text-xs text-[#71717A] block">판매가</span>
              <span className="text-2xl font-semibold font-mono tabular-nums text-[#18181B]">
                {formatKrw(activeProduct.price)}
              </span>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p
                className={`font-semibold ${
                  activeProduct.attributes.shippingFee === 0
                    ? 'text-[#15803D]'
                    : 'text-[#18181B]'
                }`}
              >
                {formatShippingFee(activeProduct.attributes.shippingFee)}
              </p>
              <p className="text-[#52525B]">{activeProduct.estimatedArrivalText}</p>
            </div>
          </div>

          <p className="text-sm text-[#52525B] leading-relaxed">{activeProduct.description}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#52525B]">
            {activeProduct.attributes.highlights.map((item) => (
              <span key={item} className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                <span>{item}</span>
              </span>
            ))}
          </div>

          {blockedForMinor && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-2.5 text-xs text-[#B91C1C]">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {activeProduct.attributes.ageRestrictionReason ||
                  '만 19세 미만 미성년자 판매 금지 품목으로 구매가 제한됩니다.'}
              </span>
            </div>
          )}

          {sameModelOffers.length > 1 && (
            <div className="pt-4 border-t border-[#E4E4E7] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-[#18181B]">
                  동일 상품 판매처 비교 (가격 · 별점 · 배송 기간)
                </h2>
                <span className="text-xs text-[#71717A] tabular-nums">
                  {sameModelOffers.length}개 판매처
                </span>
              </div>
              <div className="space-y-2">
                {sameModelOffers.map((offer) => {
                  const isCurrent = offer.id === activeProduct.id;
                  return (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => setActiveProduct(offer)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'border-[#1D4ED8] bg-[#EFF6FF]/60'
                          : 'border-[#E4E4E7] bg-[#FAFAFA] hover:border-[#A1A1AA]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#18181B]">{offer.sellerName}</span>
                        <span className="font-mono tabular-nums font-semibold text-[#18181B]">
                          {formatKrw(offer.price)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-1 text-xs text-[#52525B]">
                        <span>
                          {offer.deliveryPeriodLabel} ·{' '}
                          {formatShippingFee(offer.attributes.shippingFee)}
                        </span>
                        <StarRating
                          compact
                          rating={offer.attributes.sellerRating}
                          reviewCount={offer.attributes.reviewCount}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Primary Purchase CTAs */}
          <div className="pt-4 border-t border-[#E4E4E7] space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#52525B]">주문 수량</span>
                <div className="inline-flex items-center border border-[#E4E4E7] rounded-lg bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="주문 수량 감소"
                    className="p-2 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-mono tabular-nums font-semibold text-[#18181B]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="주문 수량 증가"
                    className="p-2 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#71717A] mr-2">총 상품 금액</span>
                <span className="text-base font-semibold font-mono tabular-nums text-[#18181B]">
                  {formatKrw(activeProduct.price * quantity)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={blockedForMinor}
                onClick={() => onAddToCart(activeProduct, quantity)}
                className="flex-1 py-3 px-4 text-sm font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                장바구니 담기
              </button>
              <button
                type="button"
                disabled={blockedForMinor}
                onClick={() => onOrderNow(activeProduct, quantity)}
                className="flex-1 py-3 px-4 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                {blockedForMinor ? '미성년자 구매 제한' : '배송 지정 후 바로 주문'}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E4E7]">
            <FeedbackButtons
              productId={activeProduct.id}
              currentRating={existingFeedback?.rating}
              isSubmitting={submittingFeedbackProductId === activeProduct.id}
              onSubmitFeedback={(pid, rating) =>
                onSubmitFeedback(
                  pid,
                  rating,
                  'recommendation',
                  undefined,
                  activeProduct.name,
                  activeProduct.sellerName
                )
              }
            />
          </div>
        </div>
      </section>

      {/* Section Navigation Tabs */}
      <div className="border-b border-[#E4E4E7] pb-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F4F4F5] rounded-lg">
          <button
            type="button"
            onClick={() => scrollToSection('product-description')}
            className="px-4 py-2 text-xs font-semibold text-[#18181B] bg-white rounded-md shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            상세 설명
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('product-specs')}
            className="px-4 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            제품 사양 · 배송 안내
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('product-reviews')}
            className="px-4 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
          >
            상품 평가 ({stats.totalReviewCount.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Section 2: Detailed Description Page Content */}
      <section id="product-description" className="scroll-mt-20 space-y-6">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-medium text-[#1D4ED8]">01. 상품 상세 설명</p>
          <h2 className="text-2xl font-semibold text-[#18181B] tracking-tight">
            {activeProduct.name} 상세 안내
          </h2>
          <p className="text-base text-[#18181B] leading-relaxed pt-1">
            {detailContent.leadSummary}
          </p>
          <p className="text-sm text-[#52525B] leading-relaxed">
            {detailContent.extendedStory}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {detailContent.pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="p-5 bg-white border border-[#E4E4E7] rounded-xl space-y-2"
            >
              <p className="text-xs font-mono text-[#71717A]">0{idx + 1}</p>
              <h3 className="text-sm font-semibold text-[#18181B]">{pillar.title}</h3>
              <p className="text-xs text-[#52525B] leading-relaxed">{pillar.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl space-y-2">
            <h3 className="text-sm font-semibold text-[#18181B]">소재 · 사용 및 관리 가이드</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">{detailContent.materialGuide}</p>
            <p className="text-xs text-[#52525B] leading-relaxed">{detailContent.careGuide}</p>
          </div>
          <div className="p-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl space-y-2">
            <h3 className="text-sm font-semibold text-[#18181B]">보증 · 교환 및 반품 안내</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              추천 사용 환경: {detailContent.usageEnvironment}
            </p>
            <p className="text-xs text-[#52525B] leading-relaxed">
              {detailContent.warrantyAndReturn}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Specifications & Delivery Matrix */}
      <section id="product-specs" className="scroll-mt-20 pt-8 border-t border-[#E4E4E7] space-y-5">
        <div>
          <p className="text-xs font-medium text-[#1D4ED8]">02. 제품 사양 및 배송 기준</p>
          <h2 className="text-xl font-semibold text-[#18181B] tracking-tight mt-1">
            상세 규격 · 판매처 조건
          </h2>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
          <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E4E4E7] text-xs">
            <div className="divide-y divide-[#E4E4E7]">
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">브랜드</dt>
                <dd className="font-medium text-[#18181B] text-right">{activeProduct.brand}</dd>
              </div>
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">판매처</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.sellerName} (
                  {activeProduct.attributes.isOfficialSeller ? '공식 인증' : '파트너 셀러'})
                </dd>
              </div>
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">소재 · 구성</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.attributes.material}
                </dd>
              </div>
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">원산지 · 출고</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.attributes.origin}
                </dd>
              </div>
            </div>

            <div className="divide-y divide-[#E4E4E7]">
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">크기 · 규격</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.attributes.dimensions}
                </dd>
              </div>
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">예상 배송 기간</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.deliveryPeriodLabel} ({activeProduct.estimatedArrivalText})
                </dd>
              </div>
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">지원 배송 방식</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.supportedDeliveries.map(getDeliverySpeedLabel).join(' · ')}
                </dd>
              </div>
              <div className="px-5 py-3.5 flex justify-between gap-4">
                <dt className="text-[#71717A] shrink-0">지원 수령 방식</dt>
                <dd className="font-medium text-[#18181B] text-right">
                  {activeProduct.supportedHandoffs.map(getHandoffLabel).join(' · ')}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {/* Section 4: Product Evaluations & Buyer Reviews */}
      <section id="product-reviews" className="scroll-mt-20 pt-8 border-t border-[#E4E4E7] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#1D4ED8]">03. 구매자 상품 평가</p>
            <h2 className="text-2xl font-semibold text-[#18181B] tracking-tight mt-1">
              실구매자 평가 및 리뷰 ({stats.totalReviewCount.toLocaleString()}건)
            </h2>
            <p className="text-xs text-[#52525B] mt-1">
              {activeProduct.sellerName} 기준 실제 배송 만족도와 상품 사용 평가를 확인하고 직접 평가를 남길 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsWritingReview((prev) => !prev);
              setReviewError(null);
              setReviewSuccess(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{isWritingReview ? '작성 닫기' : '상품 평가 작성하기'}</span>
          </button>
        </div>

        {/* Rating Dashboard */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 space-y-2 md:border-r md:border-[#E4E4E7] md:pr-6">
            <p className="text-xs text-[#71717A]">종합 평점</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold font-mono tabular-nums text-[#18181B]">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-[#71717A] font-mono">/ 5.0</span>
            </div>
            <StarRating rating={stats.averageRating} />
            <div className="pt-2 space-y-1 text-xs text-[#52525B] tabular-nums">
              <p>
                구매자 추천율{' '}
                <strong className="text-[#18181B]">{stats.recommendRate}%</strong>
              </p>
              <p>
                배송 만족도{' '}
                <strong className="text-[#18181B]">{stats.avgDeliveryRating.toFixed(1)} / 5.0</strong>
              </p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-2">
            {stats.distribution.map((row) => {
              const isFilterMatch =
                (row.stars === 5 && reviewFilter === '5') ||
                (row.stars === 4 && reviewFilter === '4') ||
                (row.stars <= 3 && reviewFilter === '3-or-less');
              return (
                <button
                  key={row.stars}
                  type="button"
                  onClick={() => {
                    if (row.stars === 5) {
                      setReviewFilter((curr) => (curr === '5' ? 'all' : '5'));
                    } else if (row.stars === 4) {
                      setReviewFilter((curr) => (curr === '4' ? 'all' : '4'));
                    } else {
                      setReviewFilter((curr) => (curr === '3-or-less' ? 'all' : '3-or-less'));
                    }
                  }}
                  className="w-full flex items-center gap-3 text-xs group cursor-pointer"
                >
                  <span
                    className={`w-10 text-left font-mono tabular-nums shrink-0 ${
                      isFilterMatch ? 'font-semibold text-[#1D4ED8]' : 'text-[#52525B]'
                    }`}
                  >
                    {row.stars}점
                  </span>
                  <div className="flex-1 h-2.5 bg-[#F4F4F5] rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isFilterMatch ? 'bg-[#1D4ED8]' : 'bg-[#F59E0B]'
                      }`}
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono tabular-nums text-[#52525B] shrink-0">
                    {row.percentage}%
                  </span>
                  <span className="w-14 text-right font-mono tabular-nums text-[#71717A] shrink-0 hidden sm:inline">
                    ({row.count.toLocaleString()})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline Review Composer */}
        {isWritingReview && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white border border-[#18181B] rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#18181B]">
                {activeProduct.name} 평가 작성
              </h3>
              <span className="text-xs text-[#71717A]">{activeProduct.sellerName}</span>
            </div>

            {reviewError && (
              <p className="text-xs text-[#DC2626] font-medium">{reviewError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-[#52525B] mb-2">상품 별점</p>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNewRating(score)}
                      aria-label={`상품 별점 ${score}점`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          score <= newRating
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'fill-[#E4E4E7] text-[#D4D4D8]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-mono tabular-nums font-semibold text-[#18181B]">
                    {newRating}.0
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#52525B] mb-2">배송 · 포장 만족도</p>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNewDeliveryRating(score)}
                      aria-label={`배송 별점 ${score}점`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          score <= newDeliveryRating
                            ? 'fill-[#1D4ED8] text-[#1D4ED8]'
                            : 'fill-[#E4E4E7] text-[#D4D4D8]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-mono tabular-nums font-semibold text-[#18181B]">
                    {newDeliveryRating}.0
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="review-title" className="block text-xs font-medium text-[#52525B] mb-1.5">
                한 줄 평가 제목
              </label>
              <input
                id="review-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="예: 마감 품질이 깔끔하고 배송도 안내 일정에 맞춰 왔어요"
                className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="review-content" className="block text-xs font-medium text-[#52525B] mb-1.5">
                상세 사용 후기
              </label>
              <textarea
                id="review-content"
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="실제 사용해 본 장단점, 배송 상태, 판매처 응대 등을 자유롭게 남겨 주세요."
                className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#52525B] mb-2">만족 포인트 선택 (선택)</p>
              <div className="flex flex-wrap gap-2">
                {proTagChoices.map((tag) => {
                  const active = selectedPros.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTogglePro(tag)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-[#FAFAFA] text-[#52525B] border-[#E4E4E7] hover:text-[#18181B]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWritingReview(false)}
                className="px-4 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] rounded-lg transition-colors cursor-pointer"
              >
                {isSubmittingReview ? '등록 중...' : '상품 평가 등록하기'}
              </button>
            </div>
          </form>
        )}

        {reviewSuccess && (
          <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs font-medium text-[#15803D]">
            {reviewSuccess}
          </div>
        )}

        {/* Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F4F4F5] rounded-lg">
            {(
              [
                { id: 'all', label: `전체 (${allReviews.length})` },
                { id: '5', label: '5점' },
                { id: '4', label: '4점' },
                { id: '3-or-less', label: '3점 이하' },
                { id: 'verified', label: '실구매 인증' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReviewFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  reviewFilter === tab.id
                    ? 'bg-white text-[#18181B] shadow-sm font-semibold'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="review-sort" className="text-xs text-[#71717A]">
              정렬
            </label>
            <select
              id="review-sort"
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
              className="px-3 py-1.5 text-xs font-medium text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg cursor-pointer"
            >
              <option value="latest">최신순</option>
              <option value="rating-desc">별점 높은순</option>
              <option value="rating-asc">별점 낮은순</option>
              <option value="helpful-desc">도움순</option>
            </select>
          </div>
        </div>

        {/* Review Cards */}
        {filteredReviews.length === 0 ? (
          <div className="p-10 bg-white border border-[#E4E4E7] rounded-xl text-center text-sm text-[#52525B]">
            선택한 조건에 해당하는 평가가 아직 없습니다.
          </div>
        ) : (
          <div className="bg-white border border-[#E4E4E7] rounded-xl divide-y divide-[#E4E4E7]">
            {filteredReviews.map((review) => {
              const isHelpful = Boolean(helpfulIds[review.id]);
              const displayHelpful = review.helpfulCount + (isHelpful ? 1 : 0);
              const dateText = new Date(review.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              });

              return (
                <article key={review.id} className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                      <StarRating rating={review.rating} />
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#18181B]">{review.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{dateText}</span>
                      {review.verifiedPurchase && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#15803D]">실구매 인증</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">배송 만족 {review.deliveryRating}.0</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setHelpfulIds((prev) => ({ ...prev, [review.id]: !prev[review.id] }))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer shrink-0 ${
                        isHelpful
                          ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8]'
                          : 'bg-white border-[#E4E4E7] text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="tabular-nums">도움이 됐어요 ({displayHelpful})</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-[#18181B]">{review.title}</h3>
                    <p className="text-sm text-[#52525B] leading-relaxed">{review.content}</p>
                  </div>

                  {review.pros.length > 0 && (
                    <p className="text-xs text-[#71717A]">
                      <span className="font-medium text-[#52525B]">만족 포인트: </span>
                      {review.pros.join(' · ')}
                    </p>
                  )}

                  {review.sellerReply && (
                    <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-[#18181B]">
                        {activeProduct.sellerName} 판매자 답변
                      </p>
                      <p className="text-[#52525B] leading-relaxed">{review.sellerReply}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
