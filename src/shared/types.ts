export type DeliverySpeed =
  | 'dawn'
  | 'next-day'
  | 'scheduled'
  | 'bundle'
  | 'eco'
  | 'overseas-express';

export type HandoffType = 'doorstep-photo' | 'locker-guard' | 'direct-quiet';

export type PreferredProductCategory =
  | '컴퓨터 · 주변기기'
  | '생활 · 주방가전'
  | '오디오 · 스마트 디바이스'
  | '도서 · 매거진'
  | '주방 · 테이블웨어'
  | '식품 · 프리미엄 식음료'
  | '홈 리빙 · 프래그런스'
  | '패션 · 데일리 잡화'
  | '뷰티 · 퍼스널 케어'
  | '스포츠 · 아웃도어 · 캠핑'
  | '문구 · 오피스 · 취미'
  | '주류 · 성인 전용 기호품';

export type ProductCategory = PreferredProductCategory;

export type SelectionPriority = 'price' | 'reliability' | 'balanced';

export type FeedbackRating = 'satisfied' | 'dissatisfied' | 'not-interested';

export interface DeliveryOptionMeta {
  id: DeliverySpeed;
  label: string;
  carrier: string;
  extraFee: number;
  extraFeeLabel: string;
  minDays: number;
  maxDays: number;
  arrivalWindow: string;
  description: string;
  requiresCustomsCode?: boolean;
}

export interface AgeAnalysis {
  birthYear: number;
  birthDateIso: string;
  age: number;
  ageGroup: string;
  isMinor: boolean;
  maskedRrn: string;
}

export interface NameChangeRequestRecord {
  id: string;
  previousName: string;
  newName: string;
  changeDate: string;
  reason: string;
  declarationText: string;
  status: '개명 신청 승인 완료';
  createdAt: string;
}

export interface ProductAttributes {
  material: string;
  origin: string;
  isOverseasDirect?: boolean;
  dimensions: string;
  sellerRating: number;
  reviewCount: number;
  isOfficialSeller: boolean;
  isFreeShipping: boolean;
  shippingFee: number;
  isAgeRestricted?: boolean;
  ageRestrictionReason?: string;
  highlights: string[];
}

export interface Product {
  id: string;
  modelGroupId: string;
  name: string;
  brand: string;
  sellerName: string;
  category: ProductCategory;
  price: number;
  image: string;
  shortSpec: string;
  description: string;
  attributes: ProductAttributes;
  supportedDeliveries: DeliverySpeed[];
  supportedHandoffs: HandoffType[];
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  deliveryPeriodLabel: string;
  estimatedArrivalText: string;
  stockStatus: '바로 출고' | '한정 수량' | '해외 직배송' | '성인 인증 필수';
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  verifiedPurchase: boolean;
  title: string;
  content: string;
  pros: string[];
  deliveryRating: number;
  helpfulCount: number;
  sellerReply?: string;
}

export interface UserOnboardingProfile {
  completed: boolean;
  completedAt?: string;
  recipientName: string;
  phone: string;
  address: string;
  customsClearanceNumber: string;
  residentRegistrationNumberMasked: string;
  birthYear?: number;
  age?: number;
  ageGroup?: string;
  isMinor: boolean;
  identityVerified: boolean;
  identityVerifiedAt?: string;
  allowOverseasShipping: boolean;
  preferredCategories: PreferredProductCategory[];
  selectionPriority: SelectionPriority;
  defaultDeliverySpeed: DeliverySpeed;
  defaultHandoff: HandoffType;
}

export interface OrderPreferenceInput {
  preferredCategories?: PreferredProductCategory[];
  selectionPriority?: SelectionPriority;
  deliverySpeed: DeliverySpeed;
  scheduledDate?: string;
  handoffType: HandoffType;
  deliveryNote: string;
}

export interface OrderItemSummary {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  items: OrderItemSummary[];
  itemsSubtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryCarrier: string;
  estimatedArrivalDate: string;
  customsClearanceNumber?: string;
  recipientName: string;
  address: string;
  preferences: OrderPreferenceInput;
  status: '주문 확정 · AI 학습 완료' | '배송 준비 중';
  aiLearningNote: string;
}

export interface FeedbackRecord {
  id: string;
  productId: string;
  productName: string;
  marketplace?: string;
  rating: FeedbackRating;
  context: 'search' | 'recommendation' | 'external';
  query?: string;
  note?: string;
  createdAt: string;
}

export interface LearnedRequirement {
  label: string;
  weight: '필수' | '높음' | '보통';
  evidence: string;
}

export interface LearnedProfile {
  updatedAt: string;
  orderCount: number;
  feedbackCount: number;
  preferredCategories: PreferredProductCategory[];
  selectionPriority: SelectionPriority;
  selectionPriorityLabel: string;
  summary: string;
  learnedRequirements: LearnedRequirement[];
  learnedDelivery: {
    preferredSpeed: DeliverySpeed;
    preferredSpeedLabel: string;
    preferredCarrier: string;
    preferredHandoff: HandoffType;
    preferredHandoffLabel: string;
    deliveryRuleSummary: string;
  };
  avoidanceRules: string[];
  lastInsight: string;
}

export interface SearchManualFilters {
  category: '전체' | ProductCategory;
  freeShippingOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating: number;
  deliverySpeed: 'all' | DeliverySpeed;
  sortBy: 'ai-match' | 'price-asc' | 'rating-desc' | 'reviews-desc';
}

export interface AISearchResultItem {
  productId: string;
  overallMatchScore: number;
  requirementMatchScore: number;
  deliveryMatchScore: number;
  matchHeadline: string;
  requirementFitReason: string;
  deliveryFitReason: string;
  recommendedDeliverySpeed: DeliverySpeed;
  recommendedHandoff: HandoffType;
  tradeoffNote?: string;
}

export interface ExternalMarketplaceProduct {
  id: string;
  marketplace: string;
  title: string;
  category: string;
  priceText: string;
  priceValue?: number;
  ratingValue?: number;
  isFreeShipping?: boolean;
  sellerTrustSummary: string;
  deliverySummary: string;
  overallMatchScore: number;
  criteriaFitReason: string;
  deliveryFitReason: string;
  productUrl: string;
  sourceTitle?: string;
}

export interface AISearchResponse {
  query: string;
  usedProfile: boolean;
  appliedFilters?: SearchManualFilters;
  interpretation: string;
  externalResults: ExternalMarketplaceProduct[];
  externalSearchNotice?: string;
  groundingSources: Array<{ title: string; uri: string }>;
  results: AISearchResultItem[];
}

export interface AIRecommendationsResponse {
  generatedAt: string;
  summary: string;
  recommendations: AISearchResultItem[];
}
