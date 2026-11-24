import { formatShippingFee, getDeliverySpeedLabel } from './catalog.ts';
import type { Product, ProductReview } from './types.ts';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const REVIEWER_NAMES = [
  '김*연',
  '박*훈',
  '이*진',
  '정*우',
  '최*아',
  '강*민',
  '윤*서',
  '조*현',
  '한*수',
  '임*지',
];

function getCategoryUsageTip(product: Product): {
  contextSentence: string;
  materialGuide: string;
  usageEnvironment: string;
  careGuide: string;
} {
  switch (product.category) {
    case '컴퓨터 · 주변기기':
      return {
        contextSentence:
          '장시간 타이핑과 정밀한 포인팅이 필요한 데스크 환경에서 피로도를 낮추고 작업 흐름을 안정적으로 유지하도록 설계되었습니다.',
        materialGuide: `${product.attributes.material} 소재를 사용해 뒤틀림과 생활 스크래치를 줄이고 손목·손끝 접촉면의 촉감을 정돈했습니다.`,
        usageEnvironment: '재택 오피스, 개발·문서 작성 데스크, 야간 저소음 작업 공간',
        careGuide: '부드러운 극세사 천으로 먼지를 닦아내고, 직사광선 및 습기를 피해 보관해 주세요.',
      };
    case '생활 · 주방가전':
      return {
        contextSentence:
          '실내 소음을 최소화하면서도 본연의 성능을 정밀하게 유지해 아침·밤 시간대에도 부담 없이 사용할 수 있습니다.',
        materialGuide: `${product.attributes.material} 구조로 내열성과 내구성을 확보했으며 매일 사용하는 생활 가전에 맞게 안전 설계를 적용했습니다.`,
        usageEnvironment: '거실, 침실, 홈카페 키친 바, 1~4인 주거 공간',
        careGuide: '전원 플러그를 분리한 상태에서 내부·외부 표면을 건조한 천으로 가볍게 관리해 주세요.',
      };
    case '오디오 · 스마트 디바이스':
      return {
        contextSentence:
          '불필요한 음색 과장 없이 원음의 밸런스와 연결 안정성을 우선해 업무 몰입과 휴식 감상에 모두 적합합니다.',
        materialGuide: `${product.attributes.material} 마감으로 음향 공진을 억제하고 휴대·거치 시 균형 잡힌 무게 중심을 유지합니다.`,
        usageEnvironment: '출퇴근 이동 중, 카페, 스튜디오 작업실, 거실 청음 공간',
        careGuide: '배터리 장기 보관 시 50% 내외 잔량을 유지하고 수분 유입을 피해 주세요.',
      };
    case '도서 · 매거진':
      return {
        contextSentence:
          '현업 실무와 깊이 있는 레퍼런스로 바로 참고할 수 있도록 제본 품질과 지면 가독성까지 꼼꼼하게 검수된 도서입니다.',
        materialGuide: `${product.attributes.material} 사양으로 펼침성이 우수해 책상 위에 펴 두고 필기·참고하기 편리합니다.`,
        usageEnvironment: '서재, 디자인·엔지니어링 스터디, 북카페 독서',
        careGuide: '습도가 높은 곳을 피해 세워 보관하면 책등 변형 없이 오래 소장할 수 있습니다.',
      };
    case '주방 · 테이블웨어':
      return {
        contextSentence:
          '매일 식탁과 티타임에 올렸을 때 손에 감기는 그립감과 온도 유지력, 세척 편의성까지 고려해 완성했습니다.',
        materialGuide: `${product.attributes.material} 소재로 음식물 착색과 냄새 배임을 줄여 위생적인 반복 사용이 가능합니다.`,
        usageEnvironment: '데일리 홈 다이닝, 핸드드립 티타임, 손님 초대 상차림',
        careGuide: '부드러운 스펀지와 중성세제로 세척한 뒤 통풍이 잘되는 곳에서 완전히 건조해 주세요.',
      };
    case '식품 · 프리미엄 식음료':
      return {
        contextSentence:
          '원재료 본연의 향미와 신선도를 가장 온전하게 전달하기 위해 수확·로스팅 이후 출고 시점과 포장을 엄격히 관리합니다.',
        materialGuide: `${product.attributes.material} 구성으로 직사광선과 산소 접촉을 차단해 개봉 직후까지 풍미를 유지합니다.`,
        usageEnvironment: '모닝 커피 루틴, 오후 티타임, 건강한 홈 쿠킹',
        careGuide: '개봉 후 밀봉 상태를 유지해 서늘하고 건조한 곳에 보관하면 최상의 향미를 즐길 수 있습니다.',
      };
    case '홈 리빙 · 프래그런스':
      return {
        contextSentence:
          '공간에 자극 없이 자연스럽게 스며드는 향기와 저자극 성분을 중심으로 일상의 쉼과 정돈감을 더해 줍니다.',
        materialGuide: `${product.attributes.material} 원료를 채택해 잔여감이나 과한 인공 향 없이 쾌적하게 사용할 수 있습니다.`,
        usageEnvironment: '현관, 침실, 욕실, 서재 등 일상의 리프레시가 필요한 공간',
        careGuide: '어린이와 반려동물의 손이 닿지 않는 평평한 곳에 두고 직사광선을 피해 보관하세요.',
      };
    case '패션 · 데일리 잡화':
      return {
        contextSentence:
          '출퇴근부터 주말 외출까지 매일 휴대해도 부담 없는 무게 배분과 생활 방수·마모 내구성에 초점을 맞췄습니다.',
        materialGuide: `${product.attributes.material} 원단과 부자재를 적용해 형태 무너짐 없이 오래 사용할 수 있습니다.`,
        usageEnvironment: '데일리 출퇴근, 비즈니스 출장, 주말 시티 트립',
        careGuide: '오염 시 젖은 천으로 가볍게 닦아 그늘에서 자연 건조해 주세요.',
      };
    case '뷰티 · 퍼스널 케어':
      return {
        contextSentence:
          '민감한 피부도 매일 안심하고 사용할 수 있도록 꼭 필요한 유효 성분 위주로 배합하고 사용감 테스트를 거쳤습니다.',
        materialGuide: `${product.attributes.material} 포뮬러로 피부 장벽 부담을 줄이고 산뜻한 마무리감을 제공합니다.`,
        usageEnvironment: '아침·저녁 데일리 스킨케어, 여행용 파우치, 운동 후 케어',
        careGuide: '사용 후 캡을 꼭 닫아 직사광선을 피한 실온에 보관해 주세요.',
      };
    case '스포츠 · 아웃도어 · 캠핑':
      return {
        contextSentence:
          '변화무쌍한 야외 환경과 강도 높은 활동에서도 안정적인 내구성과 휴대성을 발휘하도록 제작되었습니다.',
        materialGuide: `${product.attributes.material} 구조로 경량성과 강도를 동시에 챙겨 장거리 이동 시에도 실용적입니다.`,
        usageEnvironment: '주말 백패킹·캠핑, 러닝·트레킹, 홈 트레이닝',
        careGuide: '야외 사용 후 흙·수분을 털어 건조한 상태에서 전용 파우치나 건조한 곳에 보관하세요.',
      };
    case '문구 · 오피스 · 취미':
      return {
        contextSentence:
          '손에 쥐었을 때의 무게감, 필기 흐름, 종이 질감 등 기록의 몰입도를 높이는 디테일을 섬세하게 다듬었습니다.',
        materialGuide: `${product.attributes.material} 소재 특유의 에이징과 견고한 마감으로 오래 쓸수록 손에 익습니다.`,
        usageEnvironment: '업무 노트 필기, 저널링, 아이디어 스케치, 선물용 데스크 세트',
        careGuide: '잉크·심 교체 주기에 맞춰 건조한 필통이나 데스크 트레이에 보관해 주세요.',
      };
    case '주류 · 성인 전용 기호품':
      return {
        contextSentence:
          '정식 수입·유통 경로를 통해 보관 온도 및 정품 여부를 검증한 성인 인증 전용 셀렉션입니다.',
        materialGuide: `${product.attributes.material} 사양으로 병입 이후 숙성 밸런스와 고유의 아로마 노트를 안정적으로 보존합니다.`,
        usageEnvironment: '성인 전용 홈바, 기념일 페어링, 선물용 컬렉션',
        careGuide: '직사광선과 급격한 온도 변화를 피해 서늘한 곳에 세워 보관해 주세요.',
      };
  }
}

export interface ProductDetailContent {
  leadSummary: string;
  extendedStory: string;
  pillars: Array<{
    title: string;
    detail: string;
  }>;
  usageEnvironment: string;
  materialGuide: string;
  careGuide: string;
  warrantyAndReturn: string;
}

export function getProductDetailContent(product: Product): ProductDetailContent {
  const tips = getCategoryUsageTip(product);
  const sellerTrustDesc = product.attributes.isOfficialSeller
    ? `${product.sellerName} 공식 직영 판매 상품으로 정품 인증 및 공식 A/S 보증이 함께 제공됩니다.`
    : `${product.sellerName} 판매처가 공급하는 상품으로, 입점 검수 기준과 실구매자 평점 ${product.attributes.sellerRating.toFixed(1)}점을 기록하고 있습니다.`;

  const deliveryDesc = product.attributes.isOverseasDirect
    ? `해외 직배송 상품으로 ${product.deliveryPeriodLabel} 일정으로 통관 및 국내 택배 연계 배송이 진행됩니다. 개인통관고유부호 확인이 필수입니다.`
    : `국내 물류 출고 상품으로 ${product.deliveryPeriodLabel} 기준 배송되며 ${formatShippingFee(
        product.attributes.shippingFee
      )} 조건이 적용됩니다.`;

  return {
    leadSummary: product.description,
    extendedStory: `${tips.contextSentence} ${sellerTrustDesc} ${deliveryDesc}`,
    pillars: [
      {
        title: '핵심 사양 · 마감 완성도',
        detail: `${product.shortSpec}. ${tips.materialGuide}`,
      },
      {
        title: '추천 사용 환경',
        detail: `${tips.usageEnvironment}에 최적화되어 있으며, 규격(${product.attributes.dimensions}) 기준 공간 효율이 뛰어납니다.`,
      },
      {
        title: '판매처 검수 · 배송 보증',
        detail: `${product.sellerName} 출고 · ${product.deliveryPeriodLabel} 도착 예정 · ${product.supportedDeliveries
          .map(getDeliverySpeedLabel)
          .join(', ')} 지원.`,
      },
    ],
    usageEnvironment: tips.usageEnvironment,
    materialGuide: tips.materialGuide,
    careGuide: tips.careGuide,
    warrantyAndReturn: product.attributes.isOverseasDirect
      ? '해외 직배송 상품은 출고 후 단순 변심 취소 시 왕복 국제 배송비가 발생할 수 있으며, 초기 파손·오배송 시 판매처 검수 후 전액 보상됩니다.'
      : '상품 수령 후 7일 이내 미개봉·미사용 상태에서 교환 및 반품 신청이 가능하며, 제품 하자 시 판매처 부담으로 즉시 처리됩니다.',
  };
}

export function getProductReviews(
  product: Product,
  userReviews: ProductReview[] = []
): ProductReview[] {
  const seed = hashString(product.id);
  const rating = product.attributes.sellerRating;
  const highlights = product.attributes.highlights;
  const firstHighlight = highlights[0] ?? product.shortSpec;
  const secondHighlight = highlights[1] ?? product.attributes.material;

  // Pick realistic star scores consistent with sellerRating
  const starSet: Array<1 | 2 | 3 | 4 | 5> =
    rating >= 4.8
      ? [5, 5, 5, 4, 5, 5]
      : rating >= 4.5
      ? [5, 5, 4, 5, 4, 3]
      : [5, 4, 4, 3, 5, 3];

  const baseTemplates = [
    {
      title: `${firstHighlight} 부분이 기대 이상으로 만족스럽습니다`,
      content: `${product.sellerName}에서 주문했고 ${product.deliveryPeriodLabel} 일정에 맞춰 안전하게 받았습니다. 실제로 써 보니 '${firstHighlight}' 장점이 가장 크게 체감되고 마감 상태도 깔끔해 재구매 의사가 있습니다.`,
      pros: [firstHighlight, product.deliveryPeriodLabel],
      daysAgo: 2,
      sellerReply: product.attributes.isOfficialSeller
        ? `안녕하세요, ${product.sellerName}입니다. 소중한 실구매 평가 감사드리며 사용 중 문의 사항이 있으면 언제든 고객센터로 연락 주세요.`
        : undefined,
    },
    {
      title: `소재와 만듦새(${product.attributes.material})가 튼튼합니다`,
      content: `여러 판매처 조건을 비교해 보고 ${product.sellerName} 조건이 제 기준에 가장 맞아서 골랐습니다. ${secondHighlight} 특성 덕분에 매일 쓰기 좋고 포장도 파손 없이 꼼꼼하게 왔습니다.`,
      pros: [secondHighlight, product.attributes.shippingFee === 0 ? '무료배송' : '안전 포장'],
      daysAgo: 5,
    },
    {
      title: `${product.name} 가격 대비 만족도가 높네요`,
      content: product.attributes.isOverseasDirect
        ? `해외 직배송이라 기간은 ${product.deliveryPeriodLabel} 정도 걸렸지만 개인통관고유부호 연동이 자동으로 처리되어 번거로움이 없었습니다. 가격 메리트가 분명한 제품입니다.`
        : `배송비(${formatShippingFee(product.attributes.shippingFee)})와 도착 기간을 모두 따져보고 결정했는데 설명과 동일한 정품 상태로 빠르게 도착했습니다. 실사용 만족도가 높습니다.`,
      pros: ['가격 대비 만족', product.stockStatus],
      daysAgo: 9,
    },
    {
      title:
        rating >= 4.7
          ? `전반적으로 완성도가 높고 선물용으로도 손색없습니다`
          : `가성비는 좋지만 배송·안내 속도는 보통 수준입니다`,
      content:
        rating >= 4.7
          ? `규격(${product.attributes.dimensions})이 딱 맞고 군더더기 없는 디자인이라 만족합니다. 배송 기사님 수령 안내도 정확해서 비대면으로 편하게 받았습니다.`
          : `제품 자체 품질(${product.attributes.material})은 가격 생각하면 충분히 만족스럽습니다. 다만 출고 안내 메시지가 조금 늦게 와서 그 부분만 참고하시면 좋겠습니다.`,
      pros: [rating >= 4.7 ? '완성도 우수' : '가성비 우수', '정확한 규격'],
      daysAgo: 14,
    },
    {
      title: `${product.brand} 브랜드 특유의 안정감이 느껴집니다`,
      content: `기존에 쓰던 제품이 불편해 교체했는데 ${product.shortSpec} 설명 그대로라 신뢰가 갑니다. 다음에도 동일 카테고리 제품을 찾을 때 우선 고려할 것 같습니다.`,
      pros: [product.brand, '안정적인 품질'],
      daysAgo: 21,
    },
  ];

  const seededReviews: ProductReview[] = baseTemplates.map((tpl, idx) => {
    const reviewerIdx = (seed + idx * 3) % REVIEWER_NAMES.length;
    const star = starSet[idx % starSet.length];
    const createdDate = new Date(Date.now() - tpl.daysAgo * 86400000).toISOString();
    return {
      id: `SEED-${product.id}-${idx + 1}`,
      productId: product.id,
      authorName: REVIEWER_NAMES[reviewerIdx],
      rating: star,
      createdAt: createdDate,
      verifiedPurchase: idx !== 3 || rating >= 4.6,
      title: tpl.title,
      content: tpl.content,
      pros: tpl.pros,
      deliveryRating: star === 5 ? 5 : Math.max(3, star),
      helpfulCount: ((seed + idx * 7) % 18) + (idx === 0 ? 6 : 1),
      sellerReply: tpl.sellerReply,
    };
  });

  const matchingUserReviews = userReviews
    .filter((r) => r.productId === product.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return [...matchingUserReviews, ...seededReviews];
}

export interface ProductRatingStats {
  averageRating: number;
  totalReviewCount: number;
  recommendRate: number;
  avgDeliveryRating: number;
  distribution: Array<{
    stars: 5 | 4 | 3 | 2 | 1;
    percentage: number;
    count: number;
  }>;
}

export function getProductRatingStats(
  product: Product,
  allReviews: ProductReview[],
  userSubmittedCount: number
): ProductRatingStats {
  const baseCount = product.attributes.reviewCount;
  const totalCount = baseCount + userSubmittedCount;
  const r = product.attributes.sellerRating;

  // Approximate realistic star distribution anchored to sellerRating
  const p5 = Math.max(38, Math.min(88, Math.round((r - 3.0) * 42)));
  const p4 = Math.max(8, Math.min(35, Math.round((5.1 - r) * 26)));
  const p3 = Math.max(2, Math.min(18, Math.round((5.0 - r) * 14)));
  const p2 = Math.max(0, Math.min(6, r < 4.5 ? 3 : 1));
  const p1 = Math.max(0, 100 - (p5 + p4 + p3 + p2));

  const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: p5,
    4: p4,
    3: p3,
    2: p2,
    1: p1,
  };

  const avgDeliveryRating =
    allReviews.length > 0
      ? Number(
          (
            allReviews.reduce((sum, item) => sum + item.deliveryRating, 0) / allReviews.length
          ).toFixed(1)
        )
      : Number(Math.min(5, r + 0.05).toFixed(1));

  // If user submitted reviews, blend gently into displayed average
  const userRatingAvg =
    userSubmittedCount > 0
      ? allReviews.slice(0, userSubmittedCount).reduce((s, rev) => s + rev.rating, 0) /
        userSubmittedCount
      : r;
  const blendedAvg =
    userSubmittedCount > 0
      ? Number(
          ((r * Math.min(20, baseCount) + userRatingAvg * userSubmittedCount) /
            (Math.min(20, baseCount) + userSubmittedCount)).toFixed(1)
        )
      : r;

  return {
    averageRating: blendedAvg,
    totalReviewCount: totalCount,
    recommendRate: Math.min(99, p5 + p4),
    avgDeliveryRating,
    distribution: ([5, 4, 3, 2, 1] as const).map((stars) => ({
      stars,
      percentage: percentages[stars],
      count: Math.round((totalCount * percentages[stars]) / 100),
    })),
  };
}
