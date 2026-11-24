import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Globe,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  DEFAULT_SEARCH_FILTERS,
  HERO_IMAGE,
  PREFERRED_CATEGORY_OPTIONS,
  PRODUCTS,
  formatKrw,
  formatShippingFee,
  getDeliveryMeta,
  getFeedbackLabel,
  getSelectionPriorityLabel,
  rankProductsByPreference,
} from './shared/catalog.ts';
import type {
  AIRecommendationsResponse,
  AISearchResponse,
  AISearchResultItem,
  DeliverySpeed,
  FeedbackRating,
  FeedbackRecord,
  LearnedProfile,
  NameChangeRequestRecord,
  OrderPreferenceInput,
  OrderRecord,
  Product,
  ProductCategory,
  ProductReview,
  SearchManualFilters,
  UserOnboardingProfile,
} from './shared/types.ts';
import { AISearchView } from './components/AISearchView.tsx';
import { BottomNav, type ActiveTab } from './components/BottomNav.tsx';
import { CartDrawer, type CartItem } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { FeedbackButtons } from './components/FeedbackButtons.tsx';
import { Header } from './components/Header.tsx';
import { LearnedProfileView } from './components/LearnedProfileView.tsx';
import { OnboardingGate } from './components/OnboardingGate.tsx';
import { OrdersView, type OrdersSubTab } from './components/OrdersView.tsx';
import { ProductDetailPage } from './components/ProductDetailPage.tsx';
import { ProductImage } from './components/ProductImage.tsx';
import { SplitOrderNoticeModal, type SplitOrderGroup } from './components/SplitOrderNoticeModal.tsx';
import { StarRating } from './components/StarRating.tsx';

const DEFAULT_ONBOARDING: UserOnboardingProfile = {
  completed: false,
  recipientName: '',
  phone: '',
  address: '',
  customsClearanceNumber: '',
  residentRegistrationNumberMasked: '',
  isMinor: false,
  identityVerified: false,
  allowOverseasShipping: true,
  preferredCategories: ['컴퓨터 · 주변기기', '생활 · 주방가전'],
  selectionPriority: 'reliability',
  defaultDeliverySpeed: 'dawn',
  defaultHandoff: 'doorstep-photo',
};

const DEFAULT_PROFILE: LearnedProfile = {
  updatedAt: new Date().toISOString(),
  orderCount: 0,
  feedbackCount: 0,
  preferredCategories: ['컴퓨터 · 주변기기', '생활 · 주방가전'],
  selectionPriority: 'reliability',
  selectionPriorityLabel: getSelectionPriorityLabel('reliability'),
  summary:
    '초기 설정 및 주문 시 지정한 선호 카테고리, 가격·신뢰성 기준, 배송 방식을 바탕으로 AI가 개인화된 상품 기준을 학습합니다.',
  learnedRequirements: [],
  learnedDelivery: {
    preferredSpeed: 'dawn',
    preferredSpeedLabel: '새벽 · 익일 도착 배송',
    preferredCarrier: '컬리넥스트마일 새벽물류',
    preferredHandoff: 'doorstep-photo',
    preferredHandoffLabel: '문 앞 비대면 + 사진 알림',
    deliveryRuleSummary: '초기 설정 또는 첫 주문 시 지정한 배송 기준이 반영됩니다.',
  },
  avoidanceRules: [],
  lastInsight: '설정을 완료하면 맞춤형 AI 추천 및 상품 검색이 활성화됩니다.',
};

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('store');
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [onboarding, setOnboarding] = useState<UserOnboardingProfile>(DEFAULT_ONBOARDING);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [nameChangeRequests, setNameChangeRequests] = useState<NameChangeRequestRecord[]>([]);
  const [profile, setProfile] = useState<LearnedProfile>(DEFAULT_PROFILE);
  const [recommendations, setRecommendations] = useState<AIRecommendationsResponse | null>(null);

  // Selected category drill-down on the Main Storefront
  const [activeCategoryView, setActiveCategoryView] = useState<ProductCategory | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [checkoutItems, setCheckoutItems] = useState<CartItem[] | null>(null);
  const [checkoutFromCart, setCheckoutFromCart] = useState(false);
  const [checkoutPrefOverride, setCheckoutPrefOverride] =
    useState<Partial<OrderPreferenceInput> | null>(null);
  const [checkoutAddressOverride, setCheckoutAddressOverride] = useState<string | null>(null);
  const [splitOrderGroups, setSplitOrderGroups] = useState<SplitOrderGroup[] | null>(null);
  const [activeSplitGroupKey, setActiveSplitGroupKey] = useState<string | null>(null);
  const [justCompletedOrder, setJustCompletedOrder] = useState<OrderRecord | null>(null);
  const [ordersSubTab, setOrdersSubTab] = useState<OrdersSubTab>('orders');

  // AI Search + Manual Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [useProfileInSearch, setUseProfileInSearch] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchManualFilters>(DEFAULT_SEARCH_FILTERS);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<AISearchResponse | null>(null);

  // AI Recommendations & Feedback State
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [submittingFeedbackProductId, setSubmittingFeedbackProductId] = useState<string | null>(
    null
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartAddedBanner, setCartAddedBanner] = useState<{
    product: Product;
    totalCount: number;
  } | null>(null);
  const cartBannerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products)) setProducts(data.products);
        if (data.onboarding) setOnboarding(data.onboarding);
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (Array.isArray(data.nameChangeRequests)) setNameChangeRequests(data.nameChangeRequests);
        if (data.profile) setProfile(data.profile);
        if (data.recommendations) setRecommendations(data.recommendations);
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => {
        setIsInitialLoading(false);
      });

    return () => {
      if (cartBannerTimerRef.current !== null) {
        window.clearTimeout(cartBannerTimerRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3400);
  };

  const handleOpenProductDetail = (product: Product) => {
    setDetailProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (onboarding.isMinor && product.attributes.isAgeRestricted) {
      showToast('만 19세 미만 미성년자는 주류 등 성인 전용 제한 물품을 장바구니에 담을 수 없습니다.');
      return;
    }
    const safeQuantity = Math.max(1, quantity);
    const nextTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0) + safeQuantity;
    const defaultItemSpeed: DeliverySpeed = product.supportedDeliveries.includes(
      profile.learnedDelivery.preferredSpeed
    )
      ? profile.learnedDelivery.preferredSpeed
      : product.supportedDeliveries[0] ?? 'next-day';
    const defaultItemAddress = onboarding.address || '';

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + safeQuantity, selected: true }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: safeQuantity,
          selected: true,
          deliveryAddress: defaultItemAddress,
          deliverySpeed: defaultItemSpeed,
        },
      ];
    });

    if (cartBannerTimerRef.current !== null) {
      window.clearTimeout(cartBannerTimerRef.current);
    }
    setCartAddedBanner({ product, totalCount: nextTotalCount });
    cartBannerTimerRef.current = window.setTimeout(() => {
      setCartAddedBanner(null);
      cartBannerTimerRef.current = null;
    }, 4000);
  };

  const handleToggleCartItem = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleToggleAllCartItems = (selected: boolean) => {
    setCart((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleUpdateCartItemDelivery = (
    productId: string,
    patch: { deliveryAddress?: string; deliverySpeed?: DeliverySpeed }
  ) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleRemoveSelectedCartItems = () => {
    setCart((prev) => prev.filter((item) => !item.selected));
  };

  const startSplitGroupCheckout = (group: SplitOrderGroup) => {
    setActiveSplitGroupKey(group.groupKey);
    setCheckoutFromCart(true);
    setCheckoutAddressOverride(group.deliveryAddress);
    setCheckoutPrefOverride({ deliverySpeed: group.deliverySpeed });
    setCheckoutItems(group.items);
  };

  const openCheckoutForCart = () => {
    const selectedItems = cart.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    const groupMap = new Map<string, SplitOrderGroup>();
    for (const item of selectedItems) {
      const normalizedAddress = (item.deliveryAddress || onboarding.address || '').trim();
      const speed = item.deliverySpeed;
      const key = `${normalizedAddress}__||__${speed}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groupMap.set(key, {
          groupKey: key,
          deliveryAddress: normalizedAddress,
          deliverySpeed: speed,
          items: [item],
        });
      }
    }

    const groups = Array.from(groupMap.values());
    setIsCartOpen(false);

    if (groups.length > 1) {
      setSplitOrderGroups(groups);
      setActiveSplitGroupKey(null);
      return;
    }

    const singleGroup = groups[0];
    setSplitOrderGroups(null);
    setActiveSplitGroupKey(null);
    setCheckoutPrefOverride({ deliverySpeed: singleGroup.deliverySpeed });
    setCheckoutAddressOverride(singleGroup.deliveryAddress);
    setCheckoutFromCart(true);
    setCheckoutItems(singleGroup.items);
  };

  const openCheckoutForSingleProduct = (
    product: Product,
    prefOverride?: Partial<OrderPreferenceInput>,
    quantity = 1
  ) => {
    if (onboarding.isMinor && product.attributes.isAgeRestricted) {
      showToast('만 19세 미만 미성년자는 성인 전용 제한 물품을 구매할 수 없습니다.');
      return;
    }
    const safeQuantity = Math.max(1, quantity);
    const defaultItemSpeed: DeliverySpeed =
      prefOverride?.deliverySpeed ??
      (product.supportedDeliveries.includes(profile.learnedDelivery.preferredSpeed)
        ? profile.learnedDelivery.preferredSpeed
        : product.supportedDeliveries[0] ?? 'next-day');
    setSplitOrderGroups(null);
    setActiveSplitGroupKey(null);
    setCheckoutPrefOverride(prefOverride ?? null);
    setCheckoutAddressOverride(null);
    setCheckoutFromCart(false);
    setCheckoutItems([
      {
        product,
        quantity: safeQuantity,
        selected: true,
        deliveryAddress: onboarding.address || '',
        deliverySpeed: defaultItemSpeed,
      },
    ]);
  };

  const handleOrderCompleted = (
    order: OrderRecord,
    updatedProfile: LearnedProfile,
    updatedRecommendations?: AIRecommendationsResponse,
    updatedOnboarding?: UserOnboardingProfile
  ) => {
    setOrders((prev) => [order, ...prev]);
    setJustCompletedOrder(order);
    setOrdersSubTab('orders');
    setProfile(updatedProfile);
    if (updatedOnboarding) setOnboarding(updatedOnboarding);
    if (updatedRecommendations) {
      setRecommendations(updatedRecommendations);
    }
    if (checkoutFromCart && checkoutItems && checkoutItems.length > 0) {
      const orderedIds = new Set(checkoutItems.map((ci) => ci.product.id));
      setCart((prev) => prev.filter((item) => !orderedIds.has(item.product.id)));
      setCheckoutFromCart(false);
    }
    if (activeSplitGroupKey) {
      setSplitOrderGroups((prev) =>
        prev
          ? prev.map((g) =>
              g.groupKey === activeSplitGroupKey ? { ...g, completedOrder: order } : g
            )
          : null
      );
    }
    showToast(`${order.items[0]?.productName ?? '상품'} 주문이 완료되었습니다.`);
  };

  const handleExecuteSearch = async (
    overrideQuery?: string,
    overrideUseProfile?: boolean,
    overrideFilters?: SearchManualFilters,
    allowBrowseAll = false
  ) => {
    const q = (overrideQuery ?? searchQuery).trim();
    const activeFilters = overrideFilters ?? searchFilters;
    const hasFilter =
      activeFilters.category !== '전체' ||
      activeFilters.freeShippingOnly ||
      activeFilters.minPrice !== undefined ||
      activeFilters.maxPrice !== undefined ||
      activeFilters.minRating > 0 ||
      activeFilters.deliverySpeed !== 'all' ||
      activeFilters.sortBy !== 'ai-match';

    setDetailProduct(null);
    setActiveTab('search');

    if (
      activeFilters.minPrice !== undefined &&
      activeFilters.maxPrice !== undefined &&
      activeFilters.minPrice > activeFilters.maxPrice
    ) {
      setSearchError('최소 가격은 최대 가격보다 작거나 같아야 합니다.');
      return;
    }

    if (!q && !hasFilter && !allowBrowseAll) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          useProfile: overrideUseProfile ?? useProfileInSearch,
          filters: activeFilters,
          allowBrowseAll,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI 검색에 실패했습니다.');
      }
      setSearchResult(data as AISearchResponse);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'AI 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitFeedback = async (
    productId: string,
    rating: FeedbackRating,
    context: 'search' | 'recommendation' | 'external',
    query?: string,
    productName?: string,
    marketplace?: string
  ) => {
    setSubmittingFeedbackProductId(productId);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, marketplace, rating, context, query }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '피드백 저장 중 오류가 발생했습니다.');
      }

      setFeedbacks(data.feedbacks as FeedbackRecord[]);
      setProfile(data.profile as LearnedProfile);
      if (data.recommendations) {
        setRecommendations(data.recommendations as AIRecommendationsResponse);
      }

      showToast(
        `'${getFeedbackLabel(rating)}' 피드백을 AI 선호도 학습 모델에 즉시 반영했습니다.`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : '피드백 반영에 실패했습니다.');
    } finally {
      setSubmittingFeedbackProductId(null);
    }
  };

  const handleRefreshRecommendations = async () => {
    setIsRefreshingRecs(true);
    try {
      const res = await fetch('/api/ai/recommendations', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '추천 새로고침에 실패했습니다.');
      }
      setRecommendations(data.recommendations as AIRecommendationsResponse);
      showToast('최신 학습 프로필을 기준으로 AI 추천을 업데이트했습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '추천 생성에 실패했습니다.');
    } finally {
      setIsRefreshingRecs(false);
    }
  };

  const handleOrderWithRecommendation = (product: Product, rec: AISearchResultItem) => {
    openCheckoutForSingleProduct(product, {
      deliverySpeed: rec.recommendedDeliverySpeed,
      handoffType: rec.recommendedHandoff,
    });
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#52525B]">
          <Loader2 className="w-5 h-5 animate-spin text-[#18181B]" />
          <span>설정을 불러오는 중입니다...</span>
        </div>
      </div>
    );
  }

  // Mandatory Initial Verification & Onboarding Gate
  if (!onboarding.completed) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <div className="flex-1">
          <OnboardingGate
            initialData={onboarding}
            onCompleted={(payload) => {
              setOnboarding(payload.onboarding);
              setProfile(payload.profile);
              setRecommendations(payload.recommendations);
              showToast('본인확인 및 초기 설정이 완료되었습니다.');
            }}
          />
        </div>
        <footer className="border-t border-[#E4E4E7] bg-white px-4 sm:px-6 py-4">
          <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#71717A]">
            <span>SUNBYEOL · AI 취향 학습 커머스</span>
            <a
              href="/api/export/github-zip"
              download="sunbyeol-github.zip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GitHub 업로드용 ZIP 다운로드</span>
            </a>
          </div>
        </footer>
      </div>
    );
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const categoryMeta = activeCategoryView
    ? PREFERRED_CATEGORY_OPTIONS.find((c) => c.id === activeCategoryView)
    : null;
  const eligibleProducts = products.filter(
    (p) => !(onboarding.isMinor && p.attributes.isAgeRestricted)
  );
  const rankedHomeProducts = rankProductsByPreference(eligibleProducts, {
    selectionPriority: profile.selectionPriority,
    preferredCategories: profile.preferredCategories,
    preferredDeliverySpeed: profile.learnedDelivery.preferredSpeed,
    feedbacks,
  });
  const rankedCategoryProducts = activeCategoryView
    ? rankProductsByPreference(
        products.filter((p) => p.category === activeCategoryView),
        {
          selectionPriority: profile.selectionPriority,
          preferredCategories: profile.preferredCategories,
          preferredDeliverySpeed: profile.learnedDelivery.preferredSpeed,
          feedbacks,
        }
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#18181B]">
      {/* Top Bar: Search Bar Only */}
      <Header
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSubmitSearch={() => handleExecuteSearch()}
        onGoHome={() => {
          setDetailProduct(null);
          setActiveTab('store');
          setActiveCategoryView(null);
        }}
      />

      <main className="flex-1 pb-24">
        {detailProduct ? (
          <ProductDetailPage
            product={detailProduct}
            isMinor={onboarding.isMinor}
            userReviews={reviews}
            feedbacks={feedbacks}
            submittingFeedbackProductId={submittingFeedbackProductId}
            onBack={() => setDetailProduct(null)}
            onSelectCategory={(category) => {
              setDetailProduct(null);
              setActiveTab('store');
              setActiveCategoryView(category);
            }}
            onAddToCart={handleAddToCart}
            onOrderNow={(product, qty) => openCheckoutForSingleProduct(product, undefined, qty)}
            onSubmitFeedback={handleSubmitFeedback}
            onReviewCreated={(updatedReviews) => setReviews(updatedReviews)}
          />
        ) : (
          <>
            {activeTab === 'store' && !activeCategoryView && (
          <div>
            {/* Section 1: Compact Editorial Hero */}
            <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 md:py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-[#71717A]">
                      {onboarding.recipientName}님 · {onboarding.ageGroup ?? '성인'}
                      <span aria-hidden="true"> · </span>
                      선호 기준 {profile.selectionPriorityLabel}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#18181B] leading-[1.18]">
                      카테고리별 큐레이션과 다중 판매처 AI 검색을 한곳에서
                    </h1>
                    <p className="text-sm text-[#52525B] leading-relaxed max-w-2xl">
                      아래 카테고리 이미지를 선택해 맞춤 상품을 바로 둘러보거나, 상단 검색창에서 원하는 상품을 수동 필터와 함께 검색하세요.
                    </p>
                  </div>

                  {onboarding.isMinor && (
                    <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex items-center gap-2.5 text-xs text-[#92400E]">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-[#D97706]" />
                      <span>
                        미성년자({onboarding.ageGroup}) 계정으로 확인되어 주류·담배 등 성인 전용 상품 구매 및 추천이 제한됩니다.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#52525B]">
                    <span>
                      선호 배송: <strong className="text-[#18181B]">{profile.learnedDelivery.preferredSpeedLabel}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      통관부호 <span className="font-mono">{onboarding.customsClearanceNumber}</span>
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 relative rounded-xl overflow-hidden bg-[#F4F4F5] min-h-[220px] lg:min-h-[260px]">
                  <ProductImage
                    src={HERO_IMAGE}
                    alt="선별 큐레이션 리빙 및 데스크 오브제"
                    className="w-full h-full lg:absolute lg:inset-0"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                    <p className="text-xs text-white/80">
                      주문 {profile.orderCount}건 · 피드백 {feedbacks.length}건 학습됨
                    </p>
                    <p className="text-xs font-medium mt-1 line-clamp-2">{profile.summary}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 1.5: Top-Ranked Products Matching Initial Criteria */}
            <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 border-t border-[#E4E4E7]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-medium text-[#1D4ED8]">
                    초기 설정 기준 ({profile.preferredCategories.join(' · ')} ·{' '}
                    {profile.selectionPriorityLabel}) 자동 순위화
                  </p>
                  <h2 className="text-2xl font-semibold text-[#18181B] tracking-tight mt-1">
                    내 기준 최상단 맞춤 상품
                  </h2>
                  <p className="text-sm text-[#52525B] mt-1">
                    상품별 가격, 배송비, 별점과 초기 선택 기준을 종합해 가장 잘 맞는 상품을 최상단에 배치했습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-3.5 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  선택 기준 변경하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rankedHomeProducts.slice(0, 3).map(({ product, fitScore, fitReason }, idx) => (
                  <article
                    key={product.id}
                    className={`bg-white rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      idx === 0
                        ? 'border-2 border-[#1D4ED8] shadow-sm'
                        : 'border border-[#E4E4E7]'
                    }`}
                  >
                    <div>
                      <div
                        onClick={() => handleOpenProductDetail(product)}
                        className="aspect-[4/3] bg-[#F4F4F5] overflow-hidden cursor-pointer relative"
                      >
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md shadow-sm ${
                              idx === 0
                                ? 'bg-[#1D4ED8] text-white'
                                : 'bg-[#18181B]/85 text-white'
                            }`}
                          >
                            {idx === 0 ? '1위 · 내 기준 최상단' : `${idx + 1}위 추천`}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#71717A]">
                          <span className="truncate">
                            {product.brand} · {product.category}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[#1D4ED8] shrink-0">
                            적합도 {fitScore}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-[#18181B] truncate">
                            {product.sellerName}
                          </span>
                          <span className="text-[#52525B] shrink-0">
                            {product.deliveryPeriodLabel}
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
                            onClick={() => handleOpenProductDetail(product)}
                            className="text-base font-semibold text-[#18181B] hover:text-[#1D4ED8] cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          <span className="text-sm font-semibold tabular-nums text-[#18181B] shrink-0">
                            {formatKrw(product.price)}
                          </span>
                        </div>

                        <p className="text-xs text-[#52525B] line-clamp-1">{fitReason}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-[#E4E4E7] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 py-2 px-3 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        장바구니
                      </button>
                      <button
                        type="button"
                        onClick={() => openCheckoutForSingleProduct(product)}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        배송 지정 주문
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Section 2: Personalized AI Recommendations with Direct Feedback */}
            <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 border-t border-[#E4E4E7]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-medium text-[#1D4ED8]">
                    {profile.preferredCategories.join(' · ')} · {profile.selectionPriorityLabel} 반영
                  </p>
                  <h2 className="text-2xl font-semibold text-[#18181B] tracking-tight mt-1">
                    {onboarding.recipientName}님을 위한 AI 개인화 추천
                  </h2>
                  {recommendations?.summary && (
                    <p className="text-sm text-[#52525B] mt-1.5 max-w-3xl">
                      {recommendations.summary}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRefreshRecommendations}
                  disabled={isRefreshingRecs}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#18181B] bg-white border border-[#E4E4E7] hover:border-[#A1A1AA] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isRefreshingRecs ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>추천 새로고침</span>
                </button>
              </div>

              {recommendations && recommendations.recommendations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[...recommendations.recommendations]
                    .sort((a, b) => {
                      const pa = products.find((p) => p.id === a.productId);
                      const pb = products.find((p) => p.id === b.productId);
                      if (!pa || !pb) return 0;
                      const idxA = rankedHomeProducts.findIndex((r) => r.product.id === pa.id);
                      const idxB = rankedHomeProducts.findIndex((r) => r.product.id === pb.id);
                      return idxA - idxB;
                    })
                    .map((rec, idx) => {
                      const product = products.find((p) => p.id === rec.productId);
                      if (!product) return null;
                      if (onboarding.isMinor && product.attributes.isAgeRestricted) return null;

                      const deliveryMeta = getDeliveryMeta(rec.recommendedDeliverySpeed);
                      const existingFeedback = feedbacks.find((f) => f.productId === product.id);

                      return (
                        <article
                          key={product.id}
                          className={`bg-white rounded-xl overflow-hidden flex flex-col justify-between ${
                            idx === 0
                              ? 'border-2 border-[#1D4ED8] shadow-sm'
                              : 'border border-[#E4E4E7]'
                          }`}
                        >
                          <div>
                            <div
                              onClick={() => handleOpenProductDetail(product)}
                              className="aspect-[4/3] bg-[#F4F4F5] overflow-hidden cursor-pointer relative"
                            >
                              <ProductImage
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full hover:scale-[1.02] transition-transform duration-300"
                              />
                              {idx === 0 && (
                                <div className="absolute top-3 left-3">
                                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#1D4ED8] text-white rounded-md shadow-sm">
                                    1위 · 설정 기준 최상단
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-[#71717A] truncate">
                                  {product.brand} · {product.sellerName}
                                </span>
                                <span className="font-mono tabular-nums font-semibold text-[#1D4ED8] shrink-0">
                                  부합도 {rec.overallMatchScore}%
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
                                  onClick={() => handleOpenProductDetail(product)}
                                  className="text-base font-semibold text-[#18181B] hover:text-[#1D4ED8] cursor-pointer"
                                >
                                  {product.name}
                                </h3>
                                <span className="text-sm font-semibold tabular-nums text-[#18181B] shrink-0">
                                  {formatKrw(product.price)}
                                </span>
                              </div>

                              <p className="text-xs font-medium text-[#1D4ED8]">{rec.matchHeadline}</p>
                              <p className="text-xs text-[#52525B] leading-relaxed">
                                {rec.requirementFitReason}
                              </p>
                              <p className="text-xs text-[#71717A]">
                                배송 기간: {product.deliveryPeriodLabel} · 추천: {deliveryMeta.label} ({deliveryMeta.extraFeeLabel})
                              </p>
                            </div>
                          </div>

                          <div className="px-5 pb-5 pt-3 border-t border-[#E4E4E7] space-y-3">
                            <FeedbackButtons
                              productId={product.id}
                              currentRating={existingFeedback?.rating}
                              isSubmitting={submittingFeedbackProductId === product.id}
                              onSubmitFeedback={(pid, rating) =>
                                handleSubmitFeedback(
                                  pid,
                                  rating,
                                  'recommendation',
                                  undefined,
                                  product.name,
                                  'SUNBYEOL 스토어'
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() => handleOrderWithRecommendation(product, rec)}
                              className="w-full py-2.5 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                            >
                              <span>추천 배송으로 바로 주문</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                </div>
              ) : (
                <div className="p-8 bg-white border border-[#E4E4E7] rounded-xl text-center text-sm text-[#52525B]">
                  추천 새로고침을 눌러 현재 학습된 프로필 기반 맞춤 상품을 불러오세요.
                </div>
              )}
            </section>

            {/* Section 3: Diverse Category Image Cards Grid (placed below AI personalization) */}
            <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 border-t border-[#E4E4E7]">
              <div className="mb-6">
                <p className="text-xs font-medium text-[#1D4ED8]">카테고리별 탐색</p>
                <h2 className="text-2xl font-semibold text-[#18181B] tracking-tight mt-1">
                  원하는 상품 카테고리를 선택하세요
                </h2>
                <p className="text-sm text-[#52525B] mt-1">
                  카테고리 카드를 클릭하면 해당 카테고리에 속한 상품 목록으로 바로 이동합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {PREFERRED_CATEGORY_OPTIONS.map((cat) => {
                  const count = products.filter((p) => p.category === cat.id).length;
                  const isRestrictedForMinor =
                    onboarding.isMinor && Boolean(cat.isAgeRestrictedCategory);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryView(cat.id)}
                      className="group text-left bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    >
                      <div className="aspect-[4/3] w-full bg-[#F4F4F5] overflow-hidden relative">
                        <ProductImage
                          src={cat.image}
                          alt={cat.label}
                          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        {cat.isAgeRestrictedCategory && (
                          <div className="absolute inset-x-0 bottom-0 px-3 py-1.5 bg-black/75 text-white text-[11px] font-medium">
                            {isRestrictedForMinor
                              ? '만 19세 미만 구매 제한 카테고리'
                              : '만 19세 이상 성인 인증 전용'}
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-[#18181B] group-hover:text-[#1D4ED8] transition-colors">
                              {cat.label}
                            </h3>
                            <span className="text-xs font-mono tabular-nums text-[#71717A] shrink-0">
                              {count}개
                            </span>
                          </div>
                          <p className="text-xs text-[#52525B] mt-1">{cat.subtitle}</p>
                        </div>
                        <p className="text-[11px] text-[#71717A] line-clamp-2 pt-2 border-t border-[#E4E4E7]">
                          {cat.examples}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Category Drill-Down Product Listing View */}
        {activeTab === 'store' && activeCategoryView && categoryMeta && (
          <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveCategoryView(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>전체 카테고리 이미지 목록으로 돌아가기</span>
                </button>
                <h1 className="text-2xl md:text-3xl font-semibold text-[#18181B] tracking-tight">
                  {categoryMeta.label}
                </h1>
                <p className="text-sm text-[#52525B]">
                  {categoryMeta.subtitle} · {categoryMeta.examples}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextFilters: SearchManualFilters = {
                    ...DEFAULT_SEARCH_FILTERS,
                    category: categoryMeta.id,
                  };
                  setSearchFilters(nextFilters);
                  setSearchQuery(`${categoryMeta.label} 추천 상품`);
                  handleExecuteSearch(`${categoryMeta.label} 추천 상품`, useProfileInSearch, nextFilters);
                }}
                disabled={onboarding.isMinor && Boolean(categoryMeta.isAgeRestrictedCategory)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#A1A1AA] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>이 카테고리 상품 AI로 더 찾기</span>
              </button>
            </div>

            {/* Quick Category Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PREFERRED_CATEGORY_OPTIONS.map((cat) => {
                const isActive = cat.id === activeCategoryView;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryView(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-white text-[#52525B] border-[#E4E4E7] hover:text-[#18181B]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {onboarding.isMinor && categoryMeta.isAgeRestrictedCategory && (
              <div className="p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-3 text-sm text-[#B91C1C]">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    만 19세 미만 미성년자({onboarding.ageGroup}) 구매 제한 카테고리입니다
                  </p>
                  <p className="text-xs">
                    청소년보호법에 따라 주류·담배 등 성인 전용 제한 물품은 장바구니 담기 및 주문 결제가 시스템에서 차단됩니다.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {rankedCategoryProducts.map(({ product, fitScore, fitReason }, idx) => {
                const blockedForMinor =
                  onboarding.isMinor && Boolean(product.attributes.isAgeRestricted);
                const isTopMatch = idx === 0 && !blockedForMinor;
                return (
                  <article
                    key={product.id}
                    className={`group bg-white rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isTopMatch ? 'border-2 border-[#1D4ED8] shadow-sm' : 'border border-[#E4E4E7]'
                    }`}
                  >
                    <div
                      onClick={() => handleOpenProductDetail(product)}
                      className="aspect-[4/3] bg-[#F4F4F5] overflow-hidden cursor-pointer relative"
                    >
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      {isTopMatch && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#1D4ED8] text-white rounded-md shadow-sm">
                            1위 · 내 기준 최상단
                          </span>
                        </div>
                      )}
                      {blockedForMinor && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center p-4 text-center">
                          <span className="text-xs font-semibold text-white">
                            만 19세 미만 구매 불가 품목
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-[#71717A]">
                          <span className="truncate">
                            {product.brand} · {product.sellerName}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[#1D4ED8] shrink-0">
                            적합도 {fitScore}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1.5">
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
                        <h3
                          onClick={() => handleOpenProductDetail(product)}
                          className="text-base font-semibold text-[#18181B] mt-2 cursor-pointer hover:text-[#1D4ED8] transition-colors"
                        >
                          {product.name}
                        </h3>
                        <p className="text-xs font-medium text-[#18181B] mt-1">
                          배송 기간: {product.deliveryPeriodLabel}
                        </p>
                        <p className="text-xs text-[#52525B] mt-1 line-clamp-1">
                          {product.shortSpec}
                        </p>
                        <p className="text-[11px] text-[#1D4ED8] mt-1 line-clamp-1">{fitReason}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-[#E4E4E7]">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[15px] font-semibold tabular-nums text-[#18181B]">
                            {formatKrw(product.price)}
                          </span>
                          <span className="text-xs text-[#71717A] truncate">
                            총 {formatKrw(product.price + product.attributes.shippingFee)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={blockedForMinor}
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 py-2 px-3 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                          >
                            장바구니
                          </button>
                          <button
                            type="button"
                            disabled={blockedForMinor}
                            onClick={() => openCheckoutForSingleProduct(product)}
                            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {blockedForMinor ? '미성년자 구매 불가' : '배송 지정 주문'}
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

        {activeTab === 'search' && (
          <AISearchView
            query={searchQuery}
            onQueryChange={setSearchQuery}
            useProfile={useProfileInSearch}
            onToggleUseProfile={setUseProfileInSearch}
            filters={searchFilters}
            onChangeFilters={setSearchFilters}
            onExecuteSearch={handleExecuteSearch}
            isSearching={isSearching}
            searchError={searchError}
            searchResult={searchResult}
            products={products}
            onboarding={onboarding}
            profile={profile}
            feedbacks={feedbacks}
            submittingFeedbackProductId={submittingFeedbackProductId}
            onSubmitFeedback={handleSubmitFeedback}
            onSelectProduct={handleOpenProductDetail}
            onAddToCart={handleAddToCart}
            onOrderProduct={(product) => openCheckoutForSingleProduct(product)}
            onOrderWithRecommendation={handleOrderWithRecommendation}
            onGoToProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'profile' && (
          <LearnedProfileView
            onboarding={onboarding}
            profile={profile}
            feedbacks={feedbacks}
            nameChangeRequests={nameChangeRequests}
            onProfileUpdated={(payload) => {
              if (payload.onboarding) setOnboarding(payload.onboarding);
              setProfile(payload.profile);
              if (payload.orders) setOrders(payload.orders);
              if (payload.feedbacks) setFeedbacks(payload.feedbacks);
              if (payload.nameChangeRequests) setNameChangeRequests(payload.nameChangeRequests);
              if (payload.recommendations !== undefined) {
                setRecommendations(payload.recommendations);
              }
            }}
            onGoToSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            activeSubTab={ordersSubTab}
            onChangeSubTab={setOrdersSubTab}
            justCompletedOrder={justCompletedOrder}
            onDismissCompletedNotice={() => setJustCompletedOrder(null)}
            onGoToStore={() => {
              setDetailProduct(null);
              setActiveTab('store');
              setActiveCategoryView(null);
            }}
          />
        )}
          </>
        )}
      </main>

      <footer className="border-t border-[#E4E4E7] bg-white px-4 sm:px-6 py-4 mb-16">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#71717A]">
          <span>SUNBYEOL · AI 취향 학습 커머스</span>
          <a
            href="/api/export/github-zip"
            download="sunbyeol-github.zip"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GitHub 업로드용 ZIP 다운로드</span>
          </a>
        </div>
      </footer>

      {/* Bottom Fixed Dock Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setDetailProduct(null);
          setActiveTab(tab);
          if (tab === 'store') {
            setActiveCategoryView(null);
          }
        }}
        cartCount={totalCartCount}
        ordersCount={orders.length}
        hasNewOrder={Boolean(justCompletedOrder)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {cartAddedBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 inset-x-0 z-50 px-4 pb-3 pointer-events-none"
        >
          <div className="max-w-[720px] mx-auto bg-white border border-[#18181B] rounded-xl shadow-lg px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F4F4F5] shrink-0 hidden sm:block">
                <ProductImage
                  src={cartAddedBanner.product.image}
                  alt={cartAddedBanner.product.name}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#18181B]">
                  장바구니에 담았습니다
                </p>
                <p className="text-xs text-[#52525B] truncate">
                  {cartAddedBanner.product.name} · {cartAddedBanner.product.sellerName} ·{' '}
                  <span className="font-mono tabular-nums">
                    {formatKrw(cartAddedBanner.product.price)}
                  </span>{' '}
                  (장바구니 {cartAddedBanner.totalCount}개)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCartAddedBanner(null);
                  setIsCartOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                장바구니 보기
              </button>
              <button
                type="button"
                onClick={() => setCartAddedBanner(null)}
                aria-label="장바구니 알림 닫기"
                className="p-1.5 text-[#71717A] hover:text-[#18181B] rounded-lg hover:bg-[#F4F4F5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-3 bg-[#18181B] text-white text-xs font-medium rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        defaultAddress={onboarding.address || ''}
        onToggleItem={handleToggleCartItem}
        onToggleAll={handleToggleAllCartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onUpdateItemDelivery={handleUpdateCartItemDelivery}
        onRemoveItem={handleRemoveCartItem}
        onRemoveSelected={handleRemoveSelectedCartItems}
        onProceedToCheckout={openCheckoutForCart}
      />

      <SplitOrderNoticeModal
        isOpen={Boolean(splitOrderGroups) && !checkoutItems}
        groups={splitOrderGroups ?? []}
        defaultAddress={onboarding.address || ''}
        onClose={() => {
          const allDone =
            splitOrderGroups !== null &&
            splitOrderGroups.every((g) => Boolean(g.completedOrder));
          setSplitOrderGroups(null);
          setActiveSplitGroupKey(null);
          if (!allDone && cart.length > 0) {
            setIsCartOpen(true);
          }
        }}
        onProcessGroup={(group) => startSplitGroupCheckout(group)}
        onProcessNextPending={() => {
          const nextPending = splitOrderGroups?.find((g) => !g.completedOrder);
          if (nextPending) {
            startSplitGroupCheckout(nextPending);
          }
        }}
      />

      <CheckoutModal
        isOpen={Boolean(checkoutItems)}
        onClose={() => {
          setCheckoutItems(null);
          setCheckoutFromCart(false);
          setCheckoutAddressOverride(null);
          setActiveSplitGroupKey(null);
          if (
            splitOrderGroups &&
            splitOrderGroups.every((g) => Boolean(g.completedOrder))
          ) {
            setSplitOrderGroups(null);
            showToast('분리된 모든 그룹 주문이 완료되었습니다.');
          }
        }}
        items={checkoutItems ?? []}
        onboarding={onboarding}
        profile={profile}
        initialPreferenceOverride={checkoutPrefOverride}
        initialAddressOverride={checkoutAddressOverride}
        onOrderCompleted={handleOrderCompleted}
        onGoToSearch={() => {
          setSplitOrderGroups(null);
          setActiveTab('search');
        }}
        onGoToDeliveryTracking={() => {
          setSplitOrderGroups(null);
          setActiveTab('orders');
          setOrdersSubTab('tracking');
        }}
      />
    </div>
  );
}
