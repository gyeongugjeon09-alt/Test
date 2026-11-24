import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  DEFAULT_SEARCH_FILTERS,
  PRODUCTS,
  formatShippingFee,
  getDeliveryMeta,
  getDeliverySpeedLabel,
  getFeedbackLabel,
  getHandoffLabel,
  getSelectionPriorityLabel,
  rankProductsByPreference,
} from '../src/shared/catalog.ts';
import type {
  AIRecommendationsResponse,
  AISearchResponse,
  AISearchResultItem,
  DeliverySpeed,
  ExternalMarketplaceProduct,
  FeedbackRecord,
  HandoffType,
  LearnedProfile,
  OrderPreferenceInput,
  OrderRecord,
  PreferredProductCategory,
  SearchManualFilters,
  SelectionPriority,
  UserOnboardingProfile,
} from '../src/shared/types.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets 패널에서 API 키를 확인해 주세요.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatApiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return 'Gemini API 권한 오류가 발생했습니다. Settings > Secrets 패널에서 API 키를 확인해 주세요.';
  }
  if (msg.includes('400') || msg.includes('API_KEY_INVALID')) {
    return '유효하지 않은 Gemini API 키입니다. Settings > Secrets 패널에서 API 키를 확인해 주세요.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
    return '현재 AI 모델 서버의 일시적 트래픽 증가로 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  return msg || 'AI 처리 중 오류가 발생했습니다.';
}

export function isTransientQuotaOrTrafficError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('한도를 초과') ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('일시적 트래픽') ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT')
  );
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('503') ||
        msg.includes('UNAVAILABLE');
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 3000 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

const VALID_SPEEDS: DeliverySpeed[] = [
  'dawn',
  'next-day',
  'scheduled',
  'bundle',
  'eco',
  'overseas-express',
];

function sanitizeDeliverySpeed(val: string, fallback: DeliverySpeed = 'dawn'): DeliverySpeed {
  return VALID_SPEEDS.includes(val as DeliverySpeed) ? (val as DeliverySpeed) : fallback;
}

function sanitizeHandoff(val: string, fallback: HandoffType = 'doorstep-photo'): HandoffType {
  return (['doorstep-photo', 'locker-guard', 'direct-quiet'].includes(val)
    ? val
    : fallback) as HandoffType;
}

function buildCompactCatalog(includeAgeRestricted: boolean) {
  return PRODUCTS.filter((p) => includeAgeRestricted || !p.attributes.isAgeRestricted).map((p) => ({
    id: p.id,
    modelGroupId: p.modelGroupId,
    name: p.name,
    brand: p.brand,
    sellerName: p.sellerName,
    category: p.category,
    price: p.price,
    shippingFee: p.attributes.shippingFee,
    shippingFeeLabel: formatShippingFee(p.attributes.shippingFee),
    deliveryDaysMin: p.deliveryDaysMin,
    deliveryDaysMax: p.deliveryDaysMax,
    deliveryPeriodLabel: p.deliveryPeriodLabel,
    shortSpec: p.shortSpec,
    sellerRating: p.attributes.sellerRating,
    reviewCount: p.attributes.reviewCount,
    isOfficialSeller: p.attributes.isOfficialSeller,
    isFreeShipping: p.attributes.isFreeShipping,
    supportedDeliveries: p.supportedDeliveries,
    supportedHandoffs: p.supportedHandoffs,
  }));
}

export async function learnAndRecommendWithGemini(params: {
  onboarding: UserOnboardingProfile;
  orders: OrderRecord[];
  feedbacks: FeedbackRecord[];
  currentProfile: LearnedProfile;
  explicitDirectives?: OrderPreferenceInput;
}): Promise<{
  profile: LearnedProfile;
  latestInsight: string;
  recommendations: AIRecommendationsResponse;
}> {
  const { onboarding, orders, feedbacks, currentProfile, explicitDirectives } = params;
  const ai = getAiClient();

  const activeCategories: PreferredProductCategory[] =
    explicitDirectives?.preferredCategories && explicitDirectives.preferredCategories.length > 0
      ? explicitDirectives.preferredCategories
      : onboarding.preferredCategories;

  const activePriority: SelectionPriority =
    explicitDirectives?.selectionPriority ?? onboarding.selectionPriority;

  const orderContext = orders.slice(0, 10).map((o) => ({
    id: o.id,
    items: o.items.map((i) => ({
      name: i.productName,
      category: PRODUCTS.find((p) => p.id === i.productId)?.category,
      price: i.price,
    })),
    deliverySpeed: o.preferences.deliverySpeed,
    handoffType: o.preferences.handoffType,
    note: o.preferences.deliveryNote,
  }));

  const feedbackContext = feedbacks.slice(0, 15).map((f) => ({
    productId: f.productId,
    productName: f.productName,
    rating: getFeedbackLabel(f.rating),
    ratingCode: f.rating,
    query: f.query,
  }));

  const compactCatalog = buildCompactCatalog(!onboarding.isMinor);

  const prompt = `
당신은 고객의 선호 카테고리, 가격·판매처 신뢰성 선택 기준, 배송·연령대 정보, 주문 이력, 피드백('만족'/'불만족'/'관심 없음')을 종합 학습해 프로필을 갱신하고 맞춤 상품 3개를 추천하는 개인화 커머스 AI 모델입니다.

[고객 정보]
- 이름: ${onboarding.recipientName} / 연령대: ${onboarding.ageGroup ?? '성인'} (만 ${onboarding.age ?? 25}세)
- 미성년자 여부: ${onboarding.isMinor ? '예 (주류·성인물품 절대 제외)' : '아니오'}
- 선호 카테고리: ${JSON.stringify(activeCategories)}
- 선택 우선 기준: ${getSelectionPriorityLabel(activePriority)} (${activePriority})
- 기본 배송: ${onboarding.defaultDeliverySpeed} / 수령: ${onboarding.defaultHandoff}

[기존 요약] ${currentProfile.summary}
[최근 주문] ${JSON.stringify(orderContext)}
[피드백 기록] ${JSON.stringify(feedbackContext)}
[카탈로그] ${JSON.stringify(compactCatalog)}

규칙:
1. 선호 카테고리·선택 기준(price: price+shippingFee 총비용이 가장 낮은 상품 1순위 / reliability: sellerRating·reviewCount·공식판매처·빠른 배송기간 최상위 상품 1순위 / balanced: 최저가 극단과 최고가·최고별점 극단 사이의 가격·별점·배송기간 중간값 상품 1순위)·피드백('만족' 가중, '불만족'/'관심 없음' 제외)을 반영해 학습 프로필을 작성하세요.
2. ${onboarding.isMinor ? '미성년자이므로 주류·성인 전용 품목은 추천에서 제외하고 avoidanceRules에 명시하세요.' : '동일 상품(modelGroupId) 내 판매처별 가격·별점·배송기간 차이를 반영해 1순위 최적 판매처 상품을 배열 첫 번째(최상단)에 배치하세요.'}
3. preferredSpeed·recommendedDeliverySpeed는 '${VALID_SPEEDS.join("'|'")}' 중 하나, preferredHandoff·recommendedHandoff는 'doorstep-photo'|'locker-guard'|'direct-quiet' 중 하나, weight는 '필수'|'높음'|'보통' 중 하나여야 합니다.
4. 추천 상품의 recommendedDeliverySpeed, recommendedHandoff는 해당 상품의 supported* 목록 내에서 선택하세요.
`;

  try {
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              learnedRequirements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                  },
                  required: ['label', 'weight', 'evidence'],
                },
              },
              preferredSpeed: { type: Type.STRING },
              preferredHandoff: { type: Type.STRING },
              deliveryRuleSummary: { type: Type.STRING },
              avoidanceRules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              latestInsight: { type: Type.STRING },
              recommendationSummary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    overallMatchScore: { type: Type.INTEGER },
                    requirementMatchScore: { type: Type.INTEGER },
                    deliveryMatchScore: { type: Type.INTEGER },
                    matchHeadline: { type: Type.STRING },
                    requirementFitReason: { type: Type.STRING },
                    deliveryFitReason: { type: Type.STRING },
                    recommendedDeliverySpeed: { type: Type.STRING },
                    recommendedHandoff: { type: Type.STRING },
                    tradeoffNote: { type: Type.STRING },
                  },
                  required: [
                    'productId',
                    'overallMatchScore',
                    'requirementMatchScore',
                    'deliveryMatchScore',
                    'matchHeadline',
                    'requirementFitReason',
                    'deliveryFitReason',
                    'recommendedDeliverySpeed',
                    'recommendedHandoff',
                  ],
                },
              },
            },
            required: [
              'summary',
              'learnedRequirements',
              'preferredSpeed',
              'preferredHandoff',
              'deliveryRuleSummary',
              'avoidanceRules',
              'latestInsight',
              'recommendationSummary',
              'recommendations',
            ],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '').trim()) as {
      summary: string;
      learnedRequirements: Array<{ label: string; weight: string; evidence: string }>;
      preferredSpeed: string;
      preferredHandoff: string;
      deliveryRuleSummary: string;
      avoidanceRules: string[];
      latestInsight: string;
      recommendationSummary: string;
      recommendations: Array<{
        productId: string;
        overallMatchScore: number;
        requirementMatchScore: number;
        deliveryMatchScore: number;
        matchHeadline: string;
        requirementFitReason: string;
        deliveryFitReason: string;
        recommendedDeliverySpeed: string;
        recommendedHandoff: string;
        tradeoffNote?: string;
      }>;
    };

    const validSpeed = sanitizeDeliverySpeed(
      parsed.preferredSpeed,
      onboarding.defaultDeliverySpeed
    );
    const validHandoff = sanitizeHandoff(parsed.preferredHandoff, onboarding.defaultHandoff);
    const speedMeta = getDeliveryMeta(validSpeed);

    const updatedProfile: LearnedProfile = {
      updatedAt: new Date().toISOString(),
      orderCount: orders.length,
      feedbackCount: feedbacks.length,
      preferredCategories: activeCategories,
      selectionPriority: activePriority,
      selectionPriorityLabel: getSelectionPriorityLabel(activePriority),
      summary: parsed.summary,
      learnedRequirements: (parsed.learnedRequirements ?? []).slice(0, 6).map((req) => ({
        label: req.label,
        weight: (['필수', '높음', '보통'].includes(req.weight) ? req.weight : '높음') as
          | '필수'
          | '높음'
          | '보통',
        evidence: req.evidence,
      })),
      learnedDelivery: {
        preferredSpeed: validSpeed,
        preferredSpeedLabel: speedMeta.label,
        preferredCarrier: speedMeta.carrier,
        preferredHandoff: validHandoff,
        preferredHandoffLabel: getHandoffLabel(validHandoff),
        deliveryRuleSummary: parsed.deliveryRuleSummary,
      },
      avoidanceRules: (parsed.avoidanceRules ?? []).slice(0, 6),
      lastInsight: parsed.latestInsight,
    };

    const excludedIds = new Set(
      feedbacks
        .filter((f) => f.rating === 'not-interested' || f.rating === 'dissatisfied')
        .map((f) => f.productId)
    );

    const normalizedRecs = normalizeRecommendationItems(
      parsed.recommendations,
      onboarding.isMinor
    ).filter((item) => !excludedIds.has(item.productId));

    const eligibleProducts = PRODUCTS.filter(
      (p) => (!onboarding.isMinor || !p.attributes.isAgeRestricted) && !excludedIds.has(p.id)
    );
    const rankedOrderIds = rankProductsByPreference(eligibleProducts, {
      selectionPriority: activePriority,
      preferredCategories: activeCategories,
      preferredDeliverySpeed: validSpeed,
      feedbacks,
    }).map((r) => r.product.id);

    const sortedRecs = [...normalizedRecs].sort(
      (a, b) => rankedOrderIds.indexOf(a.productId) - rankedOrderIds.indexOf(b.productId)
    );

    return {
      profile: updatedProfile,
      latestInsight: parsed.latestInsight,
      recommendations: {
        generatedAt: new Date().toISOString(),
        summary: parsed.recommendationSummary,
        recommendations: sortedRecs.slice(0, 3),
      },
    };
  } catch (err) {
    throw new Error(formatApiError(err));
  }
}

export async function learnProfileFromContext(params: {
  onboarding: UserOnboardingProfile;
  orders: OrderRecord[];
  feedbacks: FeedbackRecord[];
  currentProfile: LearnedProfile;
  explicitDirectives?: OrderPreferenceInput;
}): Promise<{ profile: LearnedProfile; latestInsight: string }> {
  const { onboarding, orders, feedbacks, currentProfile, explicitDirectives } = params;
  const ai = getAiClient();

  const activeCategories: PreferredProductCategory[] =
    explicitDirectives?.preferredCategories && explicitDirectives.preferredCategories.length > 0
      ? explicitDirectives.preferredCategories
      : onboarding.preferredCategories;

  const activePriority: SelectionPriority =
    explicitDirectives?.selectionPriority ?? onboarding.selectionPriority;

  const orderContext = orders.map((o) => ({
    orderId: o.id,
    createdAt: o.createdAt,
    items: o.items.map((i) => {
      const product = PRODUCTS.find((p) => p.id === i.productId);
      return {
        productName: i.productName,
        category: product?.category,
        price: i.price,
        attributes: product?.attributes,
      };
    }),
    preferredCategories: o.preferences.preferredCategories,
    selectionPriority: o.preferences.selectionPriority,
    deliverySpeed: getDeliverySpeedLabel(o.preferences.deliverySpeed),
    deliverySpeedId: o.preferences.deliverySpeed,
    deliveryCarrier: o.deliveryCarrier,
    handoffType: getHandoffLabel(o.preferences.handoffType),
    handoffTypeId: o.preferences.handoffType,
    deliveryNote: o.preferences.deliveryNote,
  }));

  const feedbackContext = feedbacks.slice(0, 20).map((f) => {
    const product = PRODUCTS.find((p) => p.id === f.productId);
    return {
      productId: f.productId,
      productName: f.productName,
      marketplace: f.marketplace ?? '선별 스토어',
      rating: getFeedbackLabel(f.rating),
      ratingCode: f.rating,
      context: f.context,
      query: f.query,
      note: f.note,
      productAttributes: product?.attributes,
    };
  });

  const prompt = `
당신은 고객의 선호 카테고리, 가격 대비 판매처 신뢰성 선택 기준, 배송·통관·연령대 정보, 주문 이력, 그리고 추천/검색 결과 피드백('만족', '불만족', '관심 없음')을 종합 학습하는 개인화 커머스 AI 모델입니다.
아래 정보를 바탕으로 고객의 선호도를 구조화한 '학습 프로필'을 한국어로 생성하세요.

[고객 연령대 및 인증 정보]
- 고객 실명: ${onboarding.recipientName}
- 연령대 분석 결과: ${onboarding.ageGroup ?? '성인'} (만 ${onboarding.age ?? 25}세)
- 미성년자 여부(만 19세 미만): ${onboarding.isMinor ? '예 (주류·담배 등 성인 전용 물품 추천 및 노출 엄격 제외)' : '아니오 (성인)'}
- 해외 직구 허용: ${onboarding.allowOverseasShipping ? '허용' : '국내 배송만 선호'}

[고객 선호 카테고리 및 선택 기준]
선호 카테고리: ${JSON.stringify(activeCategories)}
제품 평가 우선 기준: ${getSelectionPriorityLabel(activePriority)} (코드: ${activePriority})
기본 배송 방식: ${onboarding.defaultDeliverySpeed} / 수령 방식: ${onboarding.defaultHandoff}

[기존 학습 프로필]
${JSON.stringify(currentProfile, null, 2)}

[누적 주문 이력]
${JSON.stringify(orderContext, null, 2)}

[직접 남긴 상품 피드백 ('만족' / '불만족' / '관심 없음')]
${JSON.stringify(feedbackContext, null, 2)}

학습 규칙:
1. 고객의 선호 카테고리(${activeCategories.join(', ')})와 선택 기준(${getSelectionPriorityLabel(activePriority)}), 연령대(${onboarding.ageGroup ?? '성인'})를 summary와 learnedRequirements에 명확히 반영하세요.
2. ${onboarding.isMinor ? '미성년자 고객이므로 주류·담배 등 성인 제한 품목 제외 규칙을 avoidanceRules에 반드시 포함하세요.' : '성인 고객의 선호 카테고리·가격/신뢰성 기준·배송 패턴을 균형 있게 반영하세요.'}
3. '만족' 피드백이 달린 상품 및 외부 판매처 특성은 긍정 가중치를 높이고, '불만족'/'관심 없음' 피드백 항목은 avoidanceRules에 반영하세요.
4. preferredSpeed는 반드시 '${VALID_SPEEDS.join("' | '")}' 중 하나여야 합니다.
5. preferredHandoff는 반드시 'doorstep-photo' | 'locker-guard' | 'direct-quiet' 중 하나여야 합니다.
6. weight는 반드시 '필수' | '높음' | '보통' 중 하나여야 합니다.
`;

  try {
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              learnedRequirements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                  },
                  required: ['label', 'weight', 'evidence'],
                },
              },
              preferredSpeed: { type: Type.STRING },
              preferredHandoff: { type: Type.STRING },
              deliveryRuleSummary: { type: Type.STRING },
              avoidanceRules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              latestInsight: { type: Type.STRING },
            },
            required: [
              'summary',
              'learnedRequirements',
              'preferredSpeed',
              'preferredHandoff',
              'deliveryRuleSummary',
              'avoidanceRules',
              'latestInsight',
            ],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '').trim()) as {
      summary: string;
      learnedRequirements: Array<{ label: string; weight: string; evidence: string }>;
      preferredSpeed: string;
      preferredHandoff: string;
      deliveryRuleSummary: string;
      avoidanceRules: string[];
      latestInsight: string;
    };

    const validSpeed = sanitizeDeliverySpeed(
      parsed.preferredSpeed,
      onboarding.defaultDeliverySpeed
    );
    const validHandoff = sanitizeHandoff(parsed.preferredHandoff, onboarding.defaultHandoff);
    const speedMeta = getDeliveryMeta(validSpeed);

    const updatedProfile: LearnedProfile = {
      updatedAt: new Date().toISOString(),
      orderCount: orders.length,
      feedbackCount: feedbacks.length,
      preferredCategories: activeCategories,
      selectionPriority: activePriority,
      selectionPriorityLabel: getSelectionPriorityLabel(activePriority),
      summary: parsed.summary,
      learnedRequirements: (parsed.learnedRequirements ?? []).slice(0, 6).map((req) => ({
        label: req.label,
        weight: (['필수', '높음', '보통'].includes(req.weight) ? req.weight : '높음') as
          | '필수'
          | '높음'
          | '보통',
        evidence: req.evidence,
      })),
      learnedDelivery: {
        preferredSpeed: validSpeed,
        preferredSpeedLabel: speedMeta.label,
        preferredCarrier: speedMeta.carrier,
        preferredHandoff: validHandoff,
        preferredHandoffLabel: getHandoffLabel(validHandoff),
        deliveryRuleSummary: parsed.deliveryRuleSummary,
      },
      avoidanceRules: (parsed.avoidanceRules ?? []).slice(0, 6),
      lastInsight: parsed.latestInsight,
    };

    return {
      profile: updatedProfile,
      latestInsight: parsed.latestInsight,
    };
  } catch (err) {
    throw new Error(formatApiError(err));
  }
}

function normalizeRecommendationItems(
  rawResults: Array<{
    productId: string;
    overallMatchScore: number;
    requirementMatchScore: number;
    deliveryMatchScore: number;
    matchHeadline: string;
    requirementFitReason: string;
    deliveryFitReason: string;
    recommendedDeliverySpeed: string;
    recommendedHandoff: string;
    tradeoffNote?: string;
  }>,
  isMinor: boolean
): AISearchResultItem[] {
  return (rawResults ?? [])
    .filter((r) => {
      const p = PRODUCTS.find((item) => item.id === r.productId);
      if (!p) return false;
      if (isMinor && p.attributes.isAgeRestricted) return false;
      return true;
    })
    .map((r) => {
      const product = PRODUCTS.find((p) => p.id === r.productId)!;
      const speed = product.supportedDeliveries.includes(r.recommendedDeliverySpeed as DeliverySpeed)
        ? (r.recommendedDeliverySpeed as DeliverySpeed)
        : product.supportedDeliveries[0];
      const handoff = product.supportedHandoffs.includes(r.recommendedHandoff as HandoffType)
        ? (r.recommendedHandoff as HandoffType)
        : product.supportedHandoffs[0];

      return {
        productId: r.productId,
        overallMatchScore: Math.max(0, Math.min(100, Math.round(r.overallMatchScore))),
        requirementMatchScore: Math.max(0, Math.min(100, Math.round(r.requirementMatchScore))),
        deliveryMatchScore: Math.max(0, Math.min(100, Math.round(r.deliveryMatchScore))),
        matchHeadline: r.matchHeadline,
        requirementFitReason: r.requirementFitReason,
        deliveryFitReason: r.deliveryFitReason,
        recommendedDeliverySpeed: speed,
        recommendedHandoff: handoff,
        tradeoffNote: r.tradeoffNote?.trim() || undefined,
      };
    });
}

function describeManualFilters(filters: SearchManualFilters): string {
  const parts: string[] = [];
  if (filters.category !== '전체') parts.push(`카테고리: ${filters.category}`);
  if (filters.freeShippingOnly) parts.push('무료배송 상품만');
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    parts.push(
      `가격대: ${filters.minPrice ? `${filters.minPrice.toLocaleString()}원` : '0원'} ~ ${
        filters.maxPrice ? `${filters.maxPrice.toLocaleString()}원` : '제한없음'
      }`
    );
  }
  if (filters.minRating > 0) parts.push(`별점 ${filters.minRating.toFixed(1)}점 이상`);
  if (filters.deliverySpeed !== 'all') {
    parts.push(`배송 방식: ${getDeliverySpeedLabel(filters.deliverySpeed)}`);
  }
  return parts.length > 0 ? parts.join(' / ') : '별도 수동 필터 없음';
}

async function searchExternalMarketplacesWithGrounding(params: {
  query: string;
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  feedbacks: FeedbackRecord[];
  useProfile: boolean;
  filters: SearchManualFilters;
}): Promise<{
  externalResults: ExternalMarketplaceProduct[];
  groundingSources: Array<{ title: string; uri: string }>;
}> {
  const { query, onboarding, profile, feedbacks, useProfile, filters } = params;
  const ai = getAiClient();

  const priorityDesc = getSelectionPriorityLabel(profile.selectionPriority);
  const categoriesDesc = profile.preferredCategories.join(', ');
  const deliveryDesc = profile.learnedDelivery.preferredSpeedLabel;
  const filterDesc = describeManualFilters(filters);

  const excludedExternal = feedbacks
    .filter((f) => f.rating === 'not-interested' || f.rating === 'dissatisfied')
    .map((f) => f.productName);

  const effectiveQuery =
    query.trim() ||
    (filters.category !== '전체' ? `${filters.category} 인기 추천 상품` : '인기 추천 상품');

  const searchPrompt = `
한국의 주요 이커머스 판매 사이트 및 앱(쿠팡, G마켓, 11번가, 다나와, 네이버쇼핑, 교보문고/알라딘 등)에서 "${effectiveQuery}"와 관련된 실제 판매 상품을 검색하세요.

[수동 검색 필터 조건 - 반드시 반영]
${filterDesc}

${
  onboarding.isMinor
    ? '[법적 연령 제한] 고객이 만 19세 미만 미성년자입니다. 주류, 담배, 전자담배 등 성인 전용 제한 품목은 검색 결과에서 절대 제외하세요.'
    : ''
}

${
  useProfile
    ? `고객 학습 프로필 기준:
- 고객 연령대: ${onboarding.ageGroup ?? '성인'}
- 선호 상품 카테고리: ${categoriesDesc}
- 선택 우선 기준: ${priorityDesc}
- 선호 배송 방식: ${deliveryDesc} (${profile.learnedDelivery.preferredCarrier})
- 제외/비선호 항목: ${excludedExternal.join(', ') || '없음'}`
    : ''
}

각 판매 사이트별로 검색된 실제 상품명, 판매 사이트명(예: 쿠팡, G마켓, 11번가, 다나와), 판매 가격(숫자 포함), 판매처 신뢰성(평점, 리뷰 수, 공식 판매처 여부), 배송 방식(무료배송 여부, 로켓배송/새벽배송/묶음배송/해외직구 등)을 구체적으로 정리해 주세요.
`;

  const groundedResp = await generateWithRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    })
  );

  const groundedText = (groundedResp.text ?? '').trim();
  const rawChunks = groundedResp.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const groundingSources = rawChunks
    .map((chunk) => ({
      title: chunk.web?.title?.trim() || '외부 판매처 검색 출처',
      uri: chunk.web?.uri?.trim() || '',
    }))
    .filter((s) => Boolean(s.uri))
    .slice(0, 8);

  if (!groundedText) {
    return { externalResults: [], groundingSources };
  }

  const structurePrompt = `
아래는 Google Search Grounding을 통해 쿠팡, G마켓, 11번가, 다나와 등 외부 판매 사이트에서 실제 검색된 정보입니다.
이 검색 결과와 출처 URL 목록만을 근거로 최대 4개의 외부 판매처 상품 추천 목록을 JSON으로 구조화하세요.
검색 결과에 없는 허위 상품이나 임의의 가격을 지어내지 마세요.

[고객 검색어 및 수동 필터]
검색어: "${effectiveQuery}"
수동 필터: ${filterDesc}
${onboarding.isMinor ? '주의: 만 19세 미만 미성년자이므로 주류/담배/성인용품은 절대 포함하지 마세요.' : ''}

[고객 기준 (${useProfile ? '반영됨' : '미반영'})]
- 선호 카테고리: ${categoriesDesc}
- 우선 평가 기준: ${priorityDesc}
- 선호 배송 방식: ${deliveryDesc}

[Google Search 검색 결과 텍스트]
${groundedText}

[검색된 실제 출처 URL 목록]
${JSON.stringify(groundingSources, null, 2)}

규칙:
1. marketplace에는 '쿠팡', 'G마켓', '11번가', '다나와', '네이버쇼핑', '교보문고' 등 확인된 판매 사이트 이름을 적으세요.
2. priceValue에는 확인된 정수 원화 가격(예: 129000), ratingValue에는 평점 숫자(예: 4.8), isFreeShipping에는 무료배송 여부(boolean)를 넣으세요.
3. productUrl은 [검색된 실제 출처 URL 목록] 중 해당 상품/판매처와 가장 관련 있는 uri를 사용하세요.
4. criteriaFitReason에는 고객의 선택 기준(${priorityDesc}) 및 수동 필터에 따라 왜 이 판매처/상품이 부합하는지 설명하세요.
`;

  const structuredResp = await generateWithRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: structurePrompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            externalResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  marketplace: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priceText: { type: Type.STRING },
                  priceValue: { type: Type.INTEGER },
                  ratingValue: { type: Type.NUMBER },
                  isFreeShipping: { type: Type.BOOLEAN },
                  sellerTrustSummary: { type: Type.STRING },
                  deliverySummary: { type: Type.STRING },
                  overallMatchScore: { type: Type.INTEGER },
                  criteriaFitReason: { type: Type.STRING },
                  deliveryFitReason: { type: Type.STRING },
                  productUrl: { type: Type.STRING },
                  sourceTitle: { type: Type.STRING },
                },
                required: [
                  'marketplace',
                  'title',
                  'category',
                  'priceText',
                  'sellerTrustSummary',
                  'deliverySummary',
                  'overallMatchScore',
                  'criteriaFitReason',
                  'deliveryFitReason',
                  'productUrl',
                ],
              },
            },
          },
          required: ['externalResults'],
        },
      },
    })
  );

  const parsed = JSON.parse((structuredResp.text ?? '{"externalResults":[]}').trim()) as {
    externalResults: Array<Omit<ExternalMarketplaceProduct, 'id'>>;
  };

  const validSourceUris = new Set(groundingSources.map((s) => s.uri));
  const fallbackUri = groundingSources[0]?.uri || '';

  let externalResults: ExternalMarketplaceProduct[] = (parsed.externalResults ?? [])
    .slice(0, 4)
    .map((item, idx) => ({
      id: `ext-${Date.now()}-${idx}`,
      marketplace: item.marketplace,
      title: item.title,
      category: item.category,
      priceText: item.priceText,
      priceValue: item.priceValue,
      ratingValue: item.ratingValue,
      isFreeShipping: item.isFreeShipping,
      sellerTrustSummary: item.sellerTrustSummary,
      deliverySummary: item.deliverySummary,
      overallMatchScore: Math.max(0, Math.min(100, Math.round(item.overallMatchScore))),
      criteriaFitReason: item.criteriaFitReason,
      deliveryFitReason: item.deliveryFitReason,
      productUrl: validSourceUris.has(item.productUrl) ? item.productUrl : fallbackUri,
      sourceTitle: item.sourceTitle,
    }));

  if (onboarding.isMinor) {
    const adultKeywords = ['위스키', '소주', '맥주', '와인', '담배', '전자담배', '주류', '리큐르'];
    externalResults = externalResults.filter(
      (item) => !adultKeywords.some((kw) => item.title.includes(kw) || item.category.includes(kw))
    );
  }

  return {
    externalResults,
    groundingSources,
  };
}

export async function searchProductsWithLearnedProfile(params: {
  query: string;
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  feedbacks: FeedbackRecord[];
  useProfile: boolean;
  filters?: SearchManualFilters;
}): Promise<AISearchResponse> {
  const { query, onboarding, profile, feedbacks, useProfile } = params;
  const filters: SearchManualFilters = {
    ...DEFAULT_SEARCH_FILTERS,
    ...(params.filters ?? {}),
  };

  // Never expose adult-restricted items to minors in AI search
  const compactCatalog = buildCompactCatalog(!onboarding.isMinor).filter((p) => {
    if (filters.category !== '전체' && p.category !== filters.category) return false;
    if (filters.freeShippingOnly && !p.isFreeShipping) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.minRating > 0 && p.sellerRating < filters.minRating) return false;
    if (
      filters.deliverySpeed !== 'all' &&
      !p.supportedDeliveries.includes(filters.deliverySpeed)
    ) {
      return false;
    }
    return true;
  });

  const feedbackSummary = feedbacks.slice(0, 20).map((f) => ({
    productId: f.productId,
    productName: f.productName,
    marketplace: f.marketplace ?? '선별 스토어',
    rating: getFeedbackLabel(f.rating),
    ratingCode: f.rating,
    note: f.note,
  }));

  const hasContext =
    useProfile && (onboarding.completed || profile.orderCount > 0 || feedbacks.length > 0);
  const filterDesc = describeManualFilters(filters);
  const trimmedQuery = query.trim();
  const effectiveQuery =
    trimmedQuery ||
    (filters.category !== '전체' ? `${filters.category} 추천 상품` : '필터 맞춤 추천 상품');

  const fillerWords = new Set(['추천', '상품', '해줘', '찾아줘', '인기', '가성비', '좋고', '리뷰', '많은', '또는']);
  // IMPORTANT: derive queryTokens strictly from actual user search text, never from synthetic '전체 추천 상품'
  const queryTokens = trimmedQuery
    .toLowerCase()
    .split(/[\s,·/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !fillerWords.has(t));

  const rankParams = {
    selectionPriority: hasContext ? profile.selectionPriority : ('balanced' as SelectionPriority),
    preferredCategories: hasContext ? profile.preferredCategories : [],
    preferredDeliverySpeed: hasContext ? profile.learnedDelivery.preferredSpeed : undefined,
    feedbacks,
    queryTokens,
  };

  const allowedProductObjects = PRODUCTS.filter((p) =>
    compactCatalog.some((c) => c.id === p.id)
  );
  const catalogRanked = rankProductsByPreference(allowedProductObjects, rankParams);

  const sortSearchItems = (items: AISearchResultItem[]): AISearchResultItem[] => {
    if (filters.sortBy === 'price-asc') {
      return [...items].sort((a, b) => {
        const pa = PRODUCTS.find((p) => p.id === a.productId);
        const pb = PRODUCTS.find((p) => p.id === b.productId);
        return (
          (pa ? pa.price + pa.attributes.shippingFee : 0) -
          (pb ? pb.price + pb.attributes.shippingFee : 0)
        );
      });
    }
    if (filters.sortBy === 'rating-desc') {
      return [...items].sort((a, b) => {
        const ra = PRODUCTS.find((p) => p.id === a.productId)?.attributes.sellerRating ?? 0;
        const rb = PRODUCTS.find((p) => p.id === b.productId)?.attributes.sellerRating ?? 0;
        return rb - ra;
      });
    }
    if (filters.sortBy === 'reviews-desc') {
      return [...items].sort((a, b) => {
        const rva = PRODUCTS.find((p) => p.id === a.productId)?.attributes.reviewCount ?? 0;
        const rvb = PRODUCTS.find((p) => p.id === b.productId)?.attributes.reviewCount ?? 0;
        return rvb - rva;
      });
    }
    if (filters.sortBy === 'ai-match') {
      const rankOrderIds = catalogRanked.map((r) => r.product.id);
      return [...items].sort(
        (a, b) => rankOrderIds.indexOf(a.productId) - rankOrderIds.indexOf(b.productId)
      );
    }
    return items;
  };

  const buildDeterministicFallback = (notice?: string): AISearchResponse => {
    const queryFiltered =
      queryTokens.length > 0
        ? catalogRanked.filter((r) => r.queryMatchCount > 0)
        : catalogRanked;

    const mapped: AISearchResultItem[] = sortSearchItems(
      queryFiltered.map(({ product: p, fitScore, fitReason }) => {
        const speed = p.supportedDeliveries.includes(profile.learnedDelivery.preferredSpeed)
          ? profile.learnedDelivery.preferredSpeed
          : p.supportedDeliveries[0];
        const handoff = p.supportedHandoffs.includes(profile.learnedDelivery.preferredHandoff)
          ? profile.learnedDelivery.preferredHandoff
          : p.supportedHandoffs[0];
        return {
          productId: p.id,
          overallMatchScore: fitScore,
          requirementMatchScore: fitScore,
          deliveryMatchScore: Math.min(99, fitScore + 2),
          matchHeadline: `${p.sellerName} · ${p.deliveryPeriodLabel} · 별점 ${p.attributes.sellerRating.toFixed(1)}`,
          requirementFitReason: fitReason,
          deliveryFitReason: `${getDeliverySpeedLabel(speed)} · ${getHandoffLabel(handoff)} 지원`,
          recommendedDeliverySpeed: speed,
          recommendedHandoff: handoff,
        };
      })
    ).slice(0, 12);

    const interpretation =
      mapped.length === 0
        ? `설정한 수동 필터(${filterDesc})${trimmedQuery ? ` 및 검색어('${trimmedQuery}')` : ''} 조건을 모두 만족하는 스토어 상품이 없습니다. 가격대나 별점, 배송 조건을 넓혀 다시 검색해 보세요.`
        : `${trimmedQuery ? `'${trimmedQuery}' 검색어와 ` : ''}수동 필터(${filterDesc}) 조건에 맞춰 스토어 상품 ${mapped.length}건을 ${
            hasContext ? `${getSelectionPriorityLabel(profile.selectionPriority)} 기준과 함께 ` : ''
          }정렬했습니다.`;

    return {
      query: effectiveQuery,
      usedProfile: hasContext,
      appliedFilters: filters,
      interpretation,
      externalResults: [],
      externalSearchNotice: notice,
      groundingSources: [],
      results: mapped,
    };
  };

  // If manual filters leave 0 matching store products, return immediately
  if (compactCatalog.length === 0) {
    return buildDeterministicFallback();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return buildDeterministicFallback(
      '외부 판매 사이트 실시간 웹 검색은 Gemini API 키 설정 시 활성화되며, SUNBYEOL 스토어 수동 필터 검색 결과는 즉시 반영되었습니다.'
    );
  }

  const ai = getAiClient();
  const internalPrompt = `
당신은 고객의 검색어와 수동 필터, 선호 카테고리, 가격 vs 판매처 신뢰성 기준, 배송 방식, 연령 제한을 반영하는 AI 상품 검색 엔진입니다.
필터링된 스토어 카탈로그에서 고객의 검색어("${effectiveQuery}")와 직접 관련 있는 상품을 최우선으로 매칭해 최대 8개를 선별하세요.

[고객 검색어 및 수동 필터]
검색어: "${trimmedQuery || '검색어 없음 (수동 필터 조건 기준 전체 탐색)'}"
적용된 수동 필터: ${filterDesc}
연령 제한: ${onboarding.isMinor ? '만 19세 미만 미성년자 (주류·성인물품 절대 제외)' : `${onboarding.ageGroup ?? '성인'}`}

${
  hasContext
    ? `[고객 선호 기준]
- 선호 카테고리: ${profile.preferredCategories.join(', ')}
- 제품 선택 기준: ${getSelectionPriorityLabel(profile.selectionPriority)} (${profile.selectionPriority})
- 선호 배송: ${profile.learnedDelivery.preferredSpeed} / 수령: ${profile.learnedDelivery.preferredHandoff}
- 피드백: ${JSON.stringify(feedbackSummary)}`
    : '[학습 프로필 미적용 상태] 검색어와 수동 필터에 가장 적합한 상품을 객관적으로 순위화하세요.'
}

[스토어 카탈로그]
${JSON.stringify(compactCatalog)}

평가 규칙:
1. 카탈로그 목록이 비어 있으면 results는 []을 반환하고 interpretation에 필터 조건 완화 안내를 작성하세요.
2. 검색어의 핵심 단어(상품명·브랜드·카테고리·스펙)와 일치하는 상품을 최우선으로 포함하되, 같은 상품(modelGroupId)이 여러 판매처로 존재하면 관련 판매처 상품들을 함께 포함하세요.
3. selectionPriority가 'price'이면 (price + shippingFee) 총비용이 가장 낮은 상품을, 'reliability'이면 sellerRating·reviewCount·공식판매처·빠른 배송기간이 가장 높은 상품을, 'balanced'이면 최저가 극단과 최고가·최고별점 극단 사이의 중간값(가격·별점·배송기간 균형) 상품을 1번(최상단)에 배치하세요.
4. '관심 없음' 또는 '불만족' 피드백 상품은 제외하거나 후순위로 내리세요.
5. recommendedDeliverySpeed, recommendedHandoff는 해당 상품의 supported* 목록 내에서 선택하세요.
`;

  try {
    const internalResp = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: internalPrompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interpretation: { type: Type.STRING },
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    overallMatchScore: { type: Type.INTEGER },
                    requirementMatchScore: { type: Type.INTEGER },
                    deliveryMatchScore: { type: Type.INTEGER },
                    matchHeadline: { type: Type.STRING },
                    requirementFitReason: { type: Type.STRING },
                    deliveryFitReason: { type: Type.STRING },
                    recommendedDeliverySpeed: { type: Type.STRING },
                    recommendedHandoff: { type: Type.STRING },
                    tradeoffNote: { type: Type.STRING },
                  },
                  required: [
                    'productId',
                    'overallMatchScore',
                    'requirementMatchScore',
                    'deliveryMatchScore',
                    'matchHeadline',
                    'requirementFitReason',
                    'deliveryFitReason',
                    'recommendedDeliverySpeed',
                    'recommendedHandoff',
                  ],
                },
              },
            },
            required: ['interpretation', 'results'],
          },
        },
      })
    );

    let externalData: {
      externalResults: ExternalMarketplaceProduct[];
      groundingSources: Array<{ title: string; uri: string }>;
      externalSearchNotice?: string;
    } = { externalResults: [], groundingSources: [] };

    try {
      externalData = await searchExternalMarketplacesWithGrounding({
        query: effectiveQuery,
        onboarding,
        profile,
        feedbacks,
        useProfile: hasContext,
        filters,
      });
    } catch (extErr) {
      externalData = {
        externalResults: [],
        groundingSources: [],
        externalSearchNotice: formatApiError(extErr),
      };
    }

    const parsed = JSON.parse((internalResp.text ?? '').trim()) as {
      interpretation: string;
      results: Array<{
        productId: string;
        overallMatchScore: number;
        requirementMatchScore: number;
        deliveryMatchScore: number;
        matchHeadline: string;
        requirementFitReason: string;
        deliveryFitReason: string;
        recommendedDeliverySpeed: string;
        recommendedHandoff: string;
        tradeoffNote?: string;
      }>;
    };

    const allowedIds = new Set(compactCatalog.map((p) => p.id));
    let normalized = normalizeRecommendationItems(parsed.results, onboarding.isMinor).filter((r) =>
      allowedIds.has(r.productId)
    );

    const existingIds = new Set(normalized.map((item) => item.productId));
    const topRelevant = catalogRanked
      .filter((r) => queryTokens.length === 0 || r.queryMatchCount > 0)
      .slice(0, 12);
    for (const rankedItem of topRelevant) {
      if (!existingIds.has(rankedItem.product.id) && normalized.length < 12) {
        const p = rankedItem.product;
        const speed = p.supportedDeliveries.includes(profile.learnedDelivery.preferredSpeed)
          ? profile.learnedDelivery.preferredSpeed
          : p.supportedDeliveries[0];
        const handoff = p.supportedHandoffs.includes(profile.learnedDelivery.preferredHandoff)
          ? profile.learnedDelivery.preferredHandoff
          : p.supportedHandoffs[0];
        normalized.push({
          productId: p.id,
          overallMatchScore: rankedItem.fitScore,
          requirementMatchScore: rankedItem.fitScore,
          deliveryMatchScore: Math.min(99, rankedItem.fitScore + 2),
          matchHeadline: `${p.sellerName} · ${p.deliveryPeriodLabel} · 별점 ${p.attributes.sellerRating.toFixed(1)}`,
          requirementFitReason: rankedItem.fitReason,
          deliveryFitReason: `${getDeliverySpeedLabel(speed)} 및 ${getHandoffLabel(handoff)} 지원`,
          recommendedDeliverySpeed: speed,
          recommendedHandoff: handoff,
        });
        existingIds.add(p.id);
      }
    }

    normalized = sortSearchItems(normalized).slice(0, 12);

    if (hasContext && filters.sortBy === 'ai-match' && externalData.externalResults.length > 1) {
      const extPrices = externalData.externalResults
        .map((e) => e.priceValue)
        .filter((v): v is number => typeof v === 'number');
      const midPrice =
        extPrices.length > 0 ? (Math.min(...extPrices) + Math.max(...extPrices)) / 2 : 150000;

      externalData.externalResults = [...externalData.externalResults].sort((a, b) => {
        if (profile.selectionPriority === 'price') {
          const sa = (a.isFreeShipping ? 15 : 0) - ((a.priceValue ?? 150000) / 10000) + a.overallMatchScore * 0.4;
          const sb = (b.isFreeShipping ? 15 : 0) - ((b.priceValue ?? 150000) / 10000) + b.overallMatchScore * 0.4;
          return sb - sa;
        }
        if (profile.selectionPriority === 'reliability') {
          const sa = (a.ratingValue ?? 4.5) * 15 + a.overallMatchScore * 0.5;
          const sb = (b.ratingValue ?? 4.5) * 15 + b.overallMatchScore * 0.5;
          return sb - sa;
        }
        const distA = Math.abs((a.priceValue ?? midPrice) - midPrice) / Math.max(1000, midPrice);
        const distB = Math.abs((b.priceValue ?? midPrice) - midPrice) / Math.max(1000, midPrice);
        const balA = (1 - distA) * 50 + (a.ratingValue ?? 4.5) * 8;
        const balB = (1 - distB) * 50 + (b.ratingValue ?? 4.5) * 8;
        return balB - balA;
      });
    }

    return {
      query: effectiveQuery,
      usedProfile: hasContext,
      appliedFilters: filters,
      interpretation: parsed.interpretation,
      externalResults: externalData.externalResults,
      externalSearchNotice: externalData.externalSearchNotice,
      groundingSources: externalData.groundingSources,
      results: normalized,
    };
  } catch (err) {
    // Gracefully fall back to deterministic filtered & ranked store search on any AI/network/key failure
    return buildDeterministicFallback(formatApiError(err));
  }
}

export async function generatePersonalizedRecommendations(params: {
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  orders: OrderRecord[];
  feedbacks: FeedbackRecord[];
}): Promise<AIRecommendationsResponse> {
  const { onboarding, profile, orders, feedbacks } = params;
  const ai = getAiClient();
  const compactCatalog = buildCompactCatalog(!onboarding.isMinor);

  const prompt = `
당신은 고객의 선호 카테고리(${profile.preferredCategories.join(', ')}), 선택 우선 기준(${getSelectionPriorityLabel(profile.selectionPriority)}), 연령대(${onboarding.ageGroup ?? '성인'}), 주문 이력, 선호 배송 방식, 그리고 '만족/불만족/관심 없음' 피드백을 학습해 개인에게 최적화된 상품을 추천하는 AI 모델입니다.
아래 고객 데이터를 바탕으로 카탈로그에서 가장 잘 맞는 상위 3개 상품을 추천하세요.

[초기 설정 · 연령 · 통관 정보]
${JSON.stringify({
  ageGroup: onboarding.ageGroup,
  isMinor: onboarding.isMinor,
  preferredCategories: profile.preferredCategories,
  selectionPriority: profile.selectionPriority,
  allowOverseasShipping: onboarding.allowOverseasShipping,
  defaultDeliverySpeed: onboarding.defaultDeliverySpeed,
})}

[AI 학습 프로필] ${profile.summary}
[최근 주문 상품 ID] ${JSON.stringify(orders.flatMap((o) => o.items.map((i) => i.productId)))}
[피드백 기록] ${JSON.stringify(
  feedbacks.slice(0, 15).map((f) => ({
    productId: f.productId,
    productName: f.productName,
    rating: getFeedbackLabel(f.rating),
    ratingCode: f.rating,
  }))
)}
[추천 가능 카탈로그] ${JSON.stringify(compactCatalog)}

추천 원칙:
1. '관심 없음' 또는 '불만족'으로 평가된 productId는 추천 목록에서 절대 제외하세요.
2. ${onboarding.isMinor ? '미성년자 고객이므로 주류·성인 전용 품목은 절대 포함하지 마세요.' : '성인 고객이므로 선호 카테고리에 따라 추천하세요.'}
3. 선호 카테고리(${profile.preferredCategories.join(', ')})와 선택 기준(${getSelectionPriorityLabel(profile.selectionPriority)})에 가장 잘 맞는 상품을 우선 추천하세요. ('price': 총비용 최저가 1순위 / 'reliability': 최고 별점·공식판매처·빠른 배송 1순위 / 'balanced': 최저가와 최고가·최고별점 사이의 중간값 상품 1순위)
4. recommendedDeliverySpeed, recommendedHandoff는 해당 상품의 supported* 목록 내에서 선택하세요.
`;

  try {
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    overallMatchScore: { type: Type.INTEGER },
                    requirementMatchScore: { type: Type.INTEGER },
                    deliveryMatchScore: { type: Type.INTEGER },
                    matchHeadline: { type: Type.STRING },
                    requirementFitReason: { type: Type.STRING },
                    deliveryFitReason: { type: Type.STRING },
                    recommendedDeliverySpeed: { type: Type.STRING },
                    recommendedHandoff: { type: Type.STRING },
                    tradeoffNote: { type: Type.STRING },
                  },
                  required: [
                    'productId',
                    'overallMatchScore',
                    'requirementMatchScore',
                    'deliveryMatchScore',
                    'matchHeadline',
                    'requirementFitReason',
                    'deliveryFitReason',
                    'recommendedDeliverySpeed',
                    'recommendedHandoff',
                  ],
                },
              },
            },
            required: ['summary', 'recommendations'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '').trim()) as {
      summary: string;
      recommendations: Array<{
        productId: string;
        overallMatchScore: number;
        requirementMatchScore: number;
        deliveryMatchScore: number;
        matchHeadline: string;
        requirementFitReason: string;
        deliveryFitReason: string;
        recommendedDeliverySpeed: string;
        recommendedHandoff: string;
        tradeoffNote?: string;
      }>;
    };

    const excludedIds = new Set(
      feedbacks
        .filter((f) => f.rating === 'not-interested' || f.rating === 'dissatisfied')
        .map((f) => f.productId)
    );

    const normalized = normalizeRecommendationItems(
      parsed.recommendations,
      onboarding.isMinor
    ).filter((item) => !excludedIds.has(item.productId));

    const eligibleProducts = PRODUCTS.filter(
      (p) => (!onboarding.isMinor || !p.attributes.isAgeRestricted) && !excludedIds.has(p.id)
    );
    const rankedOrderIds = rankProductsByPreference(eligibleProducts, {
      selectionPriority: profile.selectionPriority,
      preferredCategories: profile.preferredCategories,
      preferredDeliverySpeed: profile.learnedDelivery.preferredSpeed,
      feedbacks,
    }).map((r) => r.product.id);

    const sortedRecs = [...normalized].sort(
      (a, b) => rankedOrderIds.indexOf(a.productId) - rankedOrderIds.indexOf(b.productId)
    );

    return {
      generatedAt: new Date().toISOString(),
      summary: parsed.summary,
      recommendations: sortedRecs.slice(0, 3),
    };
  } catch (err) {
    throw new Error(formatApiError(err));
  }
}
