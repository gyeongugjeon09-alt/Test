import type {
  AgeAnalysis,
  DeliveryOptionMeta,
  DeliverySpeed,
  FeedbackRating,
  FeedbackRecord,
  HandoffType,
  PreferredProductCategory,
  Product,
  SearchManualFilters,
  SelectionPriority,
} from './types.ts';

export const HERO_IMAGE = '/src/assets/images/hero_curated_living_1795136456316.jpg';

export const DEFAULT_SEARCH_FILTERS: SearchManualFilters = {
  category: '전체',
  freeShippingOnly: false,
  minPrice: undefined,
  maxPrice: undefined,
  minRating: 0,
  deliverySpeed: 'all',
  sortBy: 'ai-match',
};

export const PREFERRED_CATEGORY_OPTIONS: Array<{
  id: PreferredProductCategory;
  label: string;
  subtitle: string;
  examples: string;
  image: string;
  isAgeRestrictedCategory?: boolean;
}> = [
  {
    id: '컴퓨터 · 주변기기',
    label: '컴퓨터 · 주변기기',
    subtitle: '작업 집중도를 높이는 데스크 하드웨어',
    examples: '저소음 기계식 키보드, USB-C 멀티허브, 버티컬 무선 마우스, 무소음 데스크 램프',
    image: '/src/assets/images/product_mech_keyboard_1795138391185.jpg',
  },
  {
    id: '생활 · 주방가전',
    label: '생활 · 주방가전',
    subtitle: '일상의 효율을 높이는 정숙한 생활 가전',
    examples: '인버터 공기청정기, 정밀 드립 전기주전자, 핸디 스팀다리미, 저소음 탁상 써큘레이터',
    image: '/src/assets/images/product_air_purifier_1795138391336.jpg',
  },
  {
    id: '오디오 · 스마트 디바이스',
    label: '오디오 · 스마트 디바이스',
    subtitle: '몰입감을 선사하는 사운드 · 웨어러블 기기',
    examples: 'ANC 노이즈캔슬링 헤드폰, 블루투스 스피커, 데스크 USB DAC 앰프, 골전도 이어폰',
    image: '/src/assets/images/product_anc_headphones_1795404523320.jpg',
  },
  {
    id: '도서 · 매거진',
    label: '도서 · 매거진',
    subtitle: 'IT · 디자인 · 인문을 아우르는 단행본과 아트북',
    examples: '시스템 아키텍처 실무서, 공간 디자인 비평서, UX 리서치 가이드, 타이포그래피 매거진',
    image: '/src/assets/images/product_design_book_1795138391170.jpg',
  },
  {
    id: '주방 · 테이블웨어',
    label: '주방 · 테이블웨어',
    subtitle: '공방 도자기와 내열 유리 · 주물 쿡웨어',
    examples: '여주 백자 핸드드립 서버, 무쇠 주물 더치오븐 냄비, 티타늄 커트러리, 콜드브루 보틀',
    image: '/src/assets/images/product_ceramic_dripper_1795136455834.jpg',
  },
  {
    id: '식품 · 프리미엄 식음료',
    label: '식품 · 프리미엄 식음료',
    subtitle: '산지 직송 스페셜티 원두와 건강한 미식',
    examples: '에티오피아 스페셜티 원두, 제주 세레모니얼 말차, 크레타 냉압착 올리브오일, 지리산 생벌꿀',
    image: '/src/assets/images/product_specialty_coffee_1795404523007.jpg',
  },
  {
    id: '홈 리빙 · 프래그런스',
    label: '홈 리빙 · 프래그런스',
    subtitle: '공간의 분위기를 정돈하는 향기와 친환경 리빙',
    examples: '편백 히노끼 디퓨저, 60수 고밀도 면 침구 세트, 식물성 주방세제, 화산석 인센스 홀더',
    image: '/src/assets/images/product_hinoki_diffuser_1795136456163.jpg',
  },
  {
    id: '패션 · 데일리 잡화',
    label: '패션 · 데일리 잡화',
    subtitle: '도시의 일상과 출퇴근을 위한 실용 잡화',
    examples: '코듀라 노트북 백팩, 베지터블 카드지갑, 초경량 카본 장우산, 가죽 노트북 슬리브',
    image: '/src/assets/images/product_cordura_backpack_1795138391703.jpg',
  },
  {
    id: '뷰티 · 퍼스널 케어',
    label: '뷰티 · 퍼스널 케어',
    subtitle: '피부 자극을 줄인 데일리 스킨 · 바디 케어',
    examples: '약산성 젤 클렌저, 무기자차 마일드 선크림, 판테놀 수분 세럼, 비건 두피 샴푸',
    image: '/src/assets/images/product_amber_cleanser_1795138391585.jpg',
  },
  {
    id: '스포츠 · 아웃도어 · 캠핑',
    label: '스포츠 · 아웃도어 · 캠핑',
    subtitle: '아웃도어와 홈트레이닝을 위한 고내구 장비',
    examples: '티타늄 진공 보온 플라스크, 충전식 캠핑 LED 랜턴, 천연 코르크 요가 매트, 티타늄 쿡웨어',
    image: '/src/assets/images/product_titanium_tumbler_1795404523032.jpg',
  },
  {
    id: '문구 · 오피스 · 취미',
    label: '문구 · 오피스 · 취미',
    subtitle: '기록과 사유의 즐거움을 더하는 아날로그 문구',
    examples: '솔리드 황동 만년필, 리넨 양장 노트, 월넛 레터프레스 데스크 캘린더, 제도용 황동 샤프',
    image: '/src/assets/images/product_brass_fountain_pen_1795404523343.jpg',
  },
  {
    id: '주류 · 성인 전용 기호품',
    label: '주류 · 성인 전용 기호품',
    subtitle: '만 19세 이상 성인 인증 전용 셀렉션',
    examples: '12년 싱글몰트 위스키, 안동 증류식 전통 소주, 배럴에이지드 스타우트, 감귤 오크 리큐르',
    image: '/src/assets/images/product_single_malt_whisky_1795138390937.jpg',
    isAgeRestrictedCategory: true,
  },
];

export const SELECTION_PRIORITY_OPTIONS: Array<{
  id: SelectionPriority;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: 'price',
    label: '가격 기준 우선 (최저가 · 가성비 중심)',
    shortLabel: '가격 우선',
    description:
      '같은 상품·유사 품목 중 가격과 배송비 합계가 가장 낮은 상품을 최우선(1위)으로 배치합니다.',
  },
  {
    id: 'reliability',
    label: '판매처 신뢰성 우선 (리뷰 · 별점 · 빠른 배송)',
    shortLabel: '판매처 신뢰성 우선',
    description:
      '별점, 실구매자 리뷰 수, 공식 판매처 인증 및 가장 빠른 검증 배송 옵션을 최우선(1위)으로 배치합니다.',
  },
  {
    id: 'balanced',
    label: '가격 · 판매처 신뢰성 균형 (중간값 우선)',
    shortLabel: '가격 · 신뢰성 균형',
    description:
      '최저가와 최고가·최고별점 사이의 합리적인 중간값(가격·별점·배송기간 균형) 상품을 최우선(1위)으로 배치합니다.',
  },
];

export const DELIVERY_SPEED_OPTIONS: DeliveryOptionMeta[] = [
  {
    id: 'dawn',
    label: '새벽 · 익일 도착 배송',
    carrier: '컬리넥스트마일 새벽물류',
    extraFee: 3500,
    extraFeeLabel: '+3,500원',
    minDays: 1,
    maxDays: 1,
    arrivalWindow: '오전 07:00 이전 도착',
    description: '전날 22시 이전 주문 시 다음날 아침 출근 전 문 앞 도착 (5만원 이상 무료)',
  },
  {
    id: 'next-day',
    label: '익일 일반 택배',
    carrier: 'CJ대한통운',
    extraFee: 0,
    extraFeeLabel: '무료',
    minDays: 1,
    maxDays: 2,
    arrivalWindow: '익일 오후 중 도착',
    description: '추가 비용 없는 표준 익일 택배 배송',
  },
  {
    id: 'scheduled',
    label: '지정일 · 시간대 예약 배송',
    carrier: '한진 프리미엄 지정배송',
    extraFee: 2500,
    extraFeeLabel: '+2,500원',
    minDays: 2,
    maxDays: 7,
    arrivalWindow: '지정일 희망 시간대 도착',
    description: '수령 가능한 날짜와 시간대를 직접 지정하여 안전하게 수령',
  },
  {
    id: 'bundle',
    label: '묶음 배송',
    carrier: '우체국택배 통합물류',
    extraFee: -1000,
    extraFeeLabel: '-1,000원 할인',
    minDays: 2,
    maxDays: 3,
    arrivalWindow: '2일 내 일괄 도착',
    description: '여러 상품을 한 번에 묶어 배송비와 불필요한 박스를 절감',
  },
  {
    id: 'eco',
    label: '친환경 저탄소 EV 배송',
    carrier: '로지스그린 EV 친환경 물류',
    extraFee: 0,
    extraFeeLabel: '무료',
    minDays: 2,
    maxDays: 2,
    arrivalWindow: '2일 내 EV 차량 배송',
    description: '전기 배송차량을 이용한 탄소 저감 무료 배송',
  },
  {
    id: 'overseas-express',
    label: '해외 직구 특송 · 통관 연계',
    carrier: 'DHL Express · 인천 특송통관',
    extraFee: 9000,
    extraFeeLabel: '+9,000원',
    minDays: 3,
    maxDays: 5,
    arrivalWindow: '통관 후 3~5영업일 내 도착',
    description: '사전 인증된 개인통관고유부호로 자동 통관 처리되는 해외 직배송',
    requiresCustomsCode: true,
  },
];

export const HANDOFF_OPTIONS: Array<{
  id: HandoffType;
  label: string;
  description: string;
}> = [
  { id: 'doorstep-photo', label: '문 앞 비대면 + 사진 알림', description: '초인종 없이 문 앞에 두고 완료 사진 전송' },
  { id: 'locker-guard', label: '무인택배함 · 경비실 위탁', description: '외출 중 안전한 보관함 위탁 수령' },
  { id: 'direct-quiet', label: '직접 수령 (사전 노크)', description: '도착 10분 전 메시지 후 조용히 직접 전달' },
];

export const PRODUCTS: Product[] = [
  // =========================================================================
  // 1. 컴퓨터 · 주변기기 (동일 상품 3종 판매처 비교 + 2개 추가 상품)
  // =========================================================================
  {
    id: 'keychron-silent-mech',
    modelGroupId: 'model-keychron-mech',
    name: '로우노이즈 무선 기계식 키보드 & 마우스 세트',
    brand: '모노 타이핑',
    sellerName: '모노 타이핑 공식스토어',
    category: '컴퓨터 · 주변기기',
    price: 179000,
    image: '/src/assets/images/product_mech_keyboard_1795138391185.jpg',
    shortSpec: '공식스토어 직영 · 정품 2년 보증 · 당일/새벽 출고',
    description:
      '사무실과 야간 작업에서도 부담 없는 흡음 폼 내장 저소음 무선 기계식 키보드와 알루미늄 휠 인체공학 마우스 세트입니다. 브랜드 공식 스토어 직접 보증 상품입니다.',
    attributes: {
      material: 'CNC 알루미늄 · PBT 이중사출 키캡',
      origin: '대한민국 서울 설계 (공식 직영)',
      isOverseasDirect: false,
      dimensions: '318 × 124 × 32 mm',
      sellerRating: 4.9,
      reviewCount: 1820,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['공식 브랜드 정품 보증', '별점 4.9 최상위 신뢰도', '내일 오전 7시 전 새벽 도착'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽·익일 출고)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식스토어',
    stockStatus: '바로 출고',
  },
  {
    id: 'keychron-mech-balanced',
    modelGroupId: 'model-keychron-mech',
    name: '로우노이즈 무선 기계식 키보드 & 마우스 세트',
    brand: '모노 타이핑',
    sellerName: '테크큐레이션 인증파트너',
    category: '컴퓨터 · 주변기기',
    price: 155000,
    image: '/src/assets/images/product_mech_keyboard_1795138391185.jpg',
    shortSpec: '가격·별점·배송기간 균형 중간 옵션 · 정식 유통',
    description:
      '동일한 로우노이즈 무선 기계식 키보드 & 마우스 세트 정식 유통 상품으로, 합리적인 가격과 안정적인 평점·익일 배송을 균형 있게 제공합니다.',
    attributes: {
      material: 'CNC 알루미늄 · PBT 이중사출 키캡',
      origin: '대한민국 서울 설계 (공인 파트너)',
      isOverseasDirect: false,
      dimensions: '318 × 124 × 32 mm',
      sellerRating: 4.6,
      reviewCount: 760,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간값', '공인 파트너 정식 유통', '1~2일 내 표준 익일 도착'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (표준 익일 택배)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'keychron-mech-value',
    modelGroupId: 'model-keychron-mech',
    name: '로우노이즈 무선 기계식 키보드 & 마우스 세트',
    brand: '모노 타이핑',
    sellerName: '디지털 알뜰창고 셀러',
    category: '컴퓨터 · 주변기기',
    price: 132000,
    image: '/src/assets/images/product_mech_keyboard_1795138391185.jpg',
    shortSpec: '동일 모델 최저가 특가 · 알뜰 묶음/일반 배송',
    description:
      '동일한 로우노이즈 무선 기계식 키보드 & 마우스 세트를 유통 마진을 줄여 최저가로 판매하는 창고 특가 상품입니다. 배송 기간은 다소 소요됩니다.',
    attributes: {
      material: 'CNC 알루미늄 · PBT 이중사출 키캡',
      origin: '대한민국/해외 병행 창고 출고',
      isOverseasDirect: false,
      dimensions: '318 × 124 × 32 mm',
      sellerRating: 4.2,
      reviewCount: 215,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 상품 최저가 특가', '무료 알뜰 배송', '3~4일 일반 택배 도착'],
    },
    supportedDeliveries: ['bundle', 'eco', 'next-day'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (알뜰 묶음배송)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'lumen-cordless-lamp',
    modelGroupId: 'model-lumen-lamp',
    name: '루멘 포터블 무소음 데스크 램프',
    brand: '아틀리에 루멘',
    sellerName: '아틀리에 루멘 공식관',
    category: '컴퓨터 · 주변기기',
    price: 129000,
    image: '/src/assets/images/product_desk_lamp_1795136455631.jpg',
    shortSpec: '아노다이징 알루미늄 · 무선 48시간 · 플리커프리',
    description:
      '모니터 작업 시 눈부심이 없는 플리커프리 광원과 0dB 무소음 드라이버를 적용한 무선 데스크 램프입니다.',
    attributes: {
      material: '아노다이징 알루미늄',
      origin: '대한민국 서울 설계',
      isOverseasDirect: false,
      dimensions: '120 × 120 × 310 mm',
      sellerRating: 4.7,
      reviewCount: 840,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['0dB 완전 무소음', '무선 USB-C 충전', '플리커프리 Ra97'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (새벽·익일 배송)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원',
    stockStatus: '바로 출고',
  },
  {
    id: 'linen-pulp-desk-tray',
    modelGroupId: 'model-linen-tray',
    name: '리넨 텍스처 모듈 데스크 오거나이저',
    brand: '오브제 워크',
    sellerName: '오브제 워크 직판',
    category: '컴퓨터 · 주변기기',
    price: 38000,
    image: '/src/assets/images/product_linen_tray_1795136455925.jpg',
    shortSpec: '천연 리넨 · 재생 펄프 · 가성비 4피스 구성',
    description:
      '키보드·노트북·필기구 주변을 정숙하고 따뜻하게 정리하는 4피스 데스크 트레이입니다.',
    attributes: {
      material: '천연 리넨 · 고압 재생 펄프',
      origin: '대한민국 을지로 공방',
      isOverseasDirect: false,
      dimensions: '290 × 210 × 45 mm',
      sellerRating: 4.4,
      reviewCount: 310,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['충격음 없는 패브릭 마감', '모듈형 4피스 구성', '컴팩트 데스크 핏'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (묶음·일반)',
    estimatedArrivalText: '2~3일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 2. 생활 · 주방가전 (동일 상품 3종 판매처 비교 + 추가 상품)
  // =========================================================================
  {
    id: 'pure-cylinder-air-purifier',
    modelGroupId: 'model-air-purifier',
    name: '에어모노 저소음 H13 공기청정기',
    brand: '에어모노',
    sellerName: '에어모노 공식인증관',
    category: '생활 · 주방가전',
    price: 239000,
    image: '/src/assets/images/product_air_purifier_1795138391336.jpg',
    shortSpec: '공식 스토어 · 필터 1년분 포함 · 1일 새벽배송',
    description:
      '침실과 서재에 알맞은 원통형 브러쉬드 알루미늄 바디와 초저소음 BLDC 팬을 탑재한 공기청정기 공식 스토어 정품입니다.',
    attributes: {
      material: '브러쉬드 알루미늄 · ABS 매트 화이트',
      origin: '대한민국 수원 공식 출고',
      isOverseasDirect: false,
      dimensions: 'Ø210 × 360 mm',
      sellerRating: 4.9,
      reviewCount: 1940,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['별점 4.9 공식 스토어', '19dB 초저소음 수면모드', '1일 내 새벽 도착 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'direct-quiet', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽 배송)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식관',
    stockStatus: '바로 출고',
  },
  {
    id: 'air-purifier-balanced',
    modelGroupId: 'model-air-purifier',
    name: '에어모노 저소음 H13 공기청정기',
    brand: '에어모노',
    sellerName: '리빙가전 정품파트너',
    category: '생활 · 주방가전',
    price: 205000,
    image: '/src/assets/images/product_air_purifier_1795138391336.jpg',
    shortSpec: '가격·신뢰성 균형 중간 옵션 · 2일 표준 택배',
    description:
      '동일한 에어모노 H13 공기청정기 정품으로, 합리적인 가격과 준수한 판매처 평점, 2일 내 표준 배송을 모두 충족하는 균형 모델입니다.',
    attributes: {
      material: '브러쉬드 알루미늄 · ABS 매트 화이트',
      origin: '대한민국 수원 공인 대리점',
      isOverseasDirect: false,
      dimensions: 'Ø210 × 360 mm',
      sellerRating: 4.6,
      reviewCount: 820,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3000,
      highlights: ['가격·신뢰성 균형 중간값', 'H13 트루 헤파 정품', '2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '2일 소요 (표준 익일·일반)',
    estimatedArrivalText: '2일 소요 · 배송비 3,000원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'air-purifier-value',
    modelGroupId: 'model-air-purifier',
    name: '에어모노 저소음 H13 공기청정기',
    brand: '에어모노',
    sellerName: '리퍼·이월 가전특가몰',
    category: '생활 · 주방가전',
    price: 174000,
    image: '/src/assets/images/product_air_purifier_1795138391336.jpg',
    shortSpec: '동일 모델 최저가 · 단순 개봉 특가 · 4~5일 배송',
    description:
      '동일한 에어모노 H13 공기청정기를 최저가로 구매할 수 있는 이월/창고 직송 상품입니다. 배송 기간이 4~5일 소요됩니다.',
    attributes: {
      material: '브러쉬드 알루미늄 · ABS 매트 화이트',
      origin: '대한민국 물류센터 직출고',
      isOverseasDirect: false,
      dimensions: 'Ø210 × 360 mm',
      sellerRating: 4.2,
      reviewCount: 240,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 모델 최저가', '무료 일반 화물배송', '4~5일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco', 'next-day'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 4,
    deliveryDaysMax: 5,
    deliveryPeriodLabel: '4~5일 소요 (일반 물류)',
    estimatedArrivalText: '4~5일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'oak-steel-quiet-kettle',
    modelGroupId: 'model-drip-kettle',
    name: '브러쉬드 스틸 저소음 드립 전기 주전자',
    brand: '오크 앤 스틸',
    sellerName: '오크 앤 스틸 공식스토어',
    category: '생활 · 주방가전',
    price: 135000,
    image: '/src/assets/images/product_steel_kettle_1795136456275.jpg',
    shortSpec: '42dB 저소음 가열 · 1℃ 온도 제어 · 무료배송',
    description:
      '이른 아침에도 가족이나 이웃을 방해하지 않는 42dB 저소음 댐핑 가열 기술을 적용한 정밀 드립 주전자입니다.',
    attributes: {
      material: '304 스테인리스 스틸 · 천연 월넛',
      origin: '한국/독일 합작 직수입',
      isOverseasDirect: true,
      dimensions: '275 × 145 × 195 mm (800ml)',
      sellerRating: 4.7,
      reviewCount: 690,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['42dB 저소음 가열 설계', '1℃ 정밀 온도 유지', '무료배송 · 해외 특송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'overseas-express'],
    supportedHandoffs: ['doorstep-photo', 'direct-quiet', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (새벽·익일 배송)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 3. 오디오 · 스마트 디바이스 (신규 카테고리 · 동일 상품 3종 + 스피커)
  // =========================================================================
  {
    id: 'anc-headphones-official',
    modelGroupId: 'model-anc-headphones',
    name: '모노 스튜디오 ANC 무선 노이즈캔슬링 헤드폰',
    brand: '모노 사운드',
    sellerName: '모노 사운드 공식플래그십',
    category: '오디오 · 스마트 디바이스',
    price: 329000,
    image: '/src/assets/images/product_anc_headphones_1795404523320.jpg',
    shortSpec: '공식 정품 2년 무상AS · 별점 4.9 · 1일 새벽배송',
    description:
      '45dB 하이브리드 액티브 노이즈 캔슬링과 아노다이징 알루미늄 이어컵을 탑재한 플래그십 무선 헤드폰 공식 스토어 상품입니다.',
    attributes: {
      material: '브러쉬드 알루미늄 · 양가죽 이어패드',
      origin: '대한민국 서울 공식 유통',
      isOverseasDirect: false,
      dimensions: '195 × 175 × 82 mm (265g)',
      sellerRating: 4.9,
      reviewCount: 1650,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['공식 플래그십 2년 보증', '별점 4.9 최상위 신뢰도', '1일 내 새벽 도착'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled'],
    supportedHandoffs: ['doorstep-photo', 'direct-quiet', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽·익일 특송)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식관',
    stockStatus: '바로 출고',
  },
  {
    id: 'anc-headphones-balanced',
    modelGroupId: 'model-anc-headphones',
    name: '모노 스튜디오 ANC 무선 노이즈캔슬링 헤드폰',
    brand: '모노 사운드',
    sellerName: '하이파이 사운드파트너',
    category: '오디오 · 스마트 디바이스',
    price: 286000,
    image: '/src/assets/images/product_anc_headphones_1795404523320.jpg',
    shortSpec: '가격·평점·배송기간 균형 중간값 · 익일 택배',
    description:
      '동일한 모노 스튜디오 ANC 헤드폰 정식 수입 유통품으로, 공식가 대비 가격 부담을 낮추고 1~2일 내 안정적 배송과 높은 평점을 제공합니다.',
    attributes: {
      material: '브러쉬드 알루미늄 · 양가죽 이어패드',
      origin: '국내 공인 대리점 출고',
      isOverseasDirect: false,
      dimensions: '195 × 175 × 82 mm (265g)',
      sellerRating: 4.6,
      reviewCount: 690,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간 옵션', '국내 정식 AS 가능', '1~2일 소요 익일 택배'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'bundle'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 택배)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'anc-headphones-value',
    modelGroupId: 'model-anc-headphones',
    name: '모노 스튜디오 ANC 무선 노이즈캔슬링 헤드폰',
    brand: '모노 사운드',
    sellerName: '오디오 직구아울렛',
    category: '오디오 · 스마트 디바이스',
    price: 238000,
    image: '/src/assets/images/product_anc_headphones_1795404523320.jpg',
    shortSpec: '동일 모델 최저가 해외직배송 · 4~5일 소요',
    description:
      '동일한 모노 스튜디오 ANC 무선 헤드폰을 해외 직구 최저가로 제공하는 셀러입니다. 통관 기간으로 4~5일이 소요됩니다.',
    attributes: {
      material: '브러쉬드 알루미늄 · 양가죽 이어패드',
      origin: '홍콩/일본 직구 물류센터',
      isOverseasDirect: true,
      dimensions: '195 × 175 × 82 mm (265g)',
      sellerRating: 4.2,
      reviewCount: 185,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 5500,
      highlights: ['동일 모델 최저가', '해외 직구 특송', '4~5일 소요 (통관 포함)'],
    },
    supportedDeliveries: ['overseas-express', 'bundle'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 4,
    deliveryDaysMax: 5,
    deliveryPeriodLabel: '4~5일 소요 (해외 직구)',
    estimatedArrivalText: '4~5일 소요 · 배송비 5,500원 · 최저가',
    stockStatus: '해외 직배송',
  },
  {
    id: 'sono-studio-speaker',
    modelGroupId: 'model-sono-speaker',
    name: '소노 스튜디오 미니멀 블루투스 스피커',
    brand: '소노 어쿠스틱',
    sellerName: '소노 어쿠스틱 공식스토어',
    category: '오디오 · 스마트 디바이스',
    price: 239000,
    image: '/src/assets/images/product_minimal_speaker_1795136456207.jpg',
    shortSpec: '패브릭 & 스틸 · 30W 풀레인지 · 덴마크 직발송',
    description:
      '깊은 저음과 정교한 다이얼 조작감을 갖춘 컴팩트 데스크 스피커입니다. 지정일 예약 및 해외 특송 직구 옵션을 지원합니다.',
    attributes: {
      material: '울 패브릭 · 브러쉬드 스틸',
      origin: '덴마크 코펜하겐 직발송',
      isOverseasDirect: true,
      dimensions: '185 × 165 × 110 mm',
      sellerRating: 4.5,
      reviewCount: 520,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 5500,
      highlights: ['물리 다이얼 볼륨 제어', '24시간 배터리', '해외 직구 특송 지원'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'overseas-express'],
    supportedHandoffs: ['direct-quiet', 'locker-guard', 'doorstep-photo'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 5,
    deliveryPeriodLabel: '3~5일 소요 (해외 특송)',
    estimatedArrivalText: '3~5일 소요 · 배송비 5,500원',
    stockStatus: '해외 직배송',
  },

  // =========================================================================
  // 4. 도서 · 매거진 (동일 도서 3종 판매처 비교 + 건축 아트북)
  // =========================================================================
  {
    id: 'systems-design-monograph',
    modelGroupId: 'model-systems-book',
    name: '시스템 아키텍처 & 엔지니어링 원론',
    brand: '테크 모노그래프',
    sellerName: '테크모노그래프 직영서점',
    category: '도서 · 매거진',
    price: 44000,
    image: '/src/assets/images/product_tech_book_1795138390752.jpg',
    shortSpec: '직영 서점 초판 완충포장 · 별점 4.9 · 1일 새벽배송',
    description:
      '대규모 분산 시스템 설계 원칙과 데이터 모델링 실전 사례를 다룬 IT·개발 실무자 필독 하드커버 단행본 공식 직영 서점 상품입니다.',
    attributes: {
      material: '하드커버 양장 · 친환경 미색 모조지',
      origin: '대한민국 서울 공식 출판사',
      isOverseasDirect: false,
      dimensions: '188 × 245 mm (480쪽)',
      sellerRating: 4.9,
      reviewCount: 2140,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['출판사 직영 100% 새책', '별점 4.9 최다 리뷰', '1일 내 새벽 도서배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽 도서배송)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 직영서점',
    stockStatus: '바로 출고',
  },
  {
    id: 'systems-book-balanced',
    modelGroupId: 'model-systems-book',
    name: '시스템 아키텍처 & 엔지니어링 원론',
    brand: '테크 모노그래프',
    sellerName: '북스파트너 온라인서점',
    category: '도서 · 매거진',
    price: 38600,
    image: '/src/assets/images/product_tech_book_1795138390752.jpg',
    shortSpec: '10% 정가할인 + 적정 평점 4.6 · 1~2일 도서택배',
    description:
      '동일한 시스템 아키텍처 & 엔지니어링 원론 단행본으로, 정가 할인 가격과 안정적인 평점, 익일 도서택배의 균형을 갖춘 상품입니다.',
    attributes: {
      material: '하드커버 양장 · 친환경 미색 모조지',
      origin: '대한민국 파주 물류센터',
      isOverseasDirect: false,
      dimensions: '188 × 245 mm (480쪽)',
      sellerRating: 4.6,
      reviewCount: 910,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간값', '정가 10% 할인 적용', '1~2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 도서택배)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'systems-book-value',
    modelGroupId: 'model-systems-book',
    name: '시스템 아키텍처 & 엔지니어링 원론',
    brand: '테크 모노그래프',
    sellerName: '알뜰서적 오픈마켓',
    category: '도서 · 매거진',
    price: 32500,
    image: '/src/assets/images/product_tech_book_1795138390752.jpg',
    shortSpec: '동일 도서 최저가 · 리퍼/보관 도서 · 3~4일 배송',
    description:
      '동일한 시스템 아키텍처 & 엔지니어링 원론 도서를 가장 저렴한 가격에 판매하는 알뜰 서적 셀러입니다.',
    attributes: {
      material: '하드커버 양장 · 친환경 미색 모조지',
      origin: '대한민국 지방 서점 위탁',
      isOverseasDirect: false,
      dimensions: '188 × 245 mm (480쪽)',
      sellerRating: 4.3,
      reviewCount: 280,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 도서 최저가', '무료 일반 우편택배', '3~4일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (일반 우편택배)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'arch-lines-spaces-book',
    modelGroupId: 'model-arch-book',
    name: '빛과 공간의 건축 비평서 (양장 하드커버)',
    brand: '아키텍처 프레스',
    sellerName: '아키텍처 프레스 공식관',
    category: '도서 · 매거진',
    price: 31000,
    image: '/src/assets/images/product_design_book_1795138391170.jpg',
    shortSpec: '리넨 양장 320p · 건축·공간 사진집 · 무료배송',
    description:
      '현대 주거 공간과 채광, 재료의 물성을 180여 컷의 도판과 비평 에세이로 엮은 리넨 하드커버 디자인 아트북입니다.',
    attributes: {
      material: '천연 리넨 양장 · 130g 무광 아트지',
      origin: '대한민국 파주 출판단지',
      isOverseasDirect: false,
      dimensions: '210 × 275 mm (320쪽)',
      sellerRating: 4.5,
      reviewCount: 610,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['리넨 하드커버 제본', '고해상도 건축 도판', '무료 익일 도서 배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 도서배송)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 5. 주방 · 테이블웨어 (동일 상품 3종 + 콜드브루 보틀)
  // =========================================================================
  {
    id: 'seoul-ceramic-dripper',
    modelGroupId: 'model-ceramic-dripper',
    name: '백자 스톤웨어 핸드드립 서버 세트',
    brand: '여주 요업소',
    sellerName: '여주 요업소 공식공방',
    category: '주방 · 테이블웨어',
    price: 78000,
    image: '/src/assets/images/product_ceramic_dripper_1795136455834.jpg',
    shortSpec: '공방 작가 직송 · 파손 100% 보장 · 1일 새벽배송',
    description:
      '여주 도예 공방에서 1,250도 환원 소성으로 빚은 매트 백자 드리퍼와 내열 유리 서버 세트 공식 공방 출고 상품입니다.',
    attributes: {
      material: '백자 스톤웨어 · 붕규산 유리',
      origin: '대한민국 경기도 여주 공방',
      isOverseasDirect: false,
      dimensions: '드리퍼 Ø115 × H95 mm (400ml)',
      sellerRating: 4.9,
      reviewCount: 1280,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['도예 공방 직접 검수', '별점 4.9 최상위 평점', '1일 내 새벽 안전배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽 안전배송)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식공방',
    stockStatus: '한정 수량',
  },
  {
    id: 'ceramic-dripper-balanced',
    modelGroupId: 'model-ceramic-dripper',
    name: '백자 스톤웨어 핸드드립 서버 세트',
    brand: '여주 요업소',
    sellerName: '서울 테이블 셀렉트',
    category: '주방 · 테이블웨어',
    price: 65000,
    image: '/src/assets/images/product_ceramic_dripper_1795136455834.jpg',
    shortSpec: '가격·별점·배송기간 균형 중간 옵션 · 2일 택배',
    description:
      '동일한 여주 백자 핸드드립 서버 세트로, 합리적 판매가와 안정적 4.6 평점, 2일 표준 배송을 갖춘 리빙 셀렉트숍 상품입니다.',
    attributes: {
      material: '백자 스톤웨어 · 붕규산 유리',
      origin: '대한민국 서울 셀렉트 물류',
      isOverseasDirect: false,
      dimensions: '드리퍼 Ø115 × H95 mm (400ml)',
      sellerRating: 4.6,
      reviewCount: 540,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3500,
      highlights: ['가격·신뢰성 균형 중간값', '완충 2중 안전포장', '2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '2일 소요 (표준 택배)',
    estimatedArrivalText: '2일 소요 · 배송비 3,500원 · 셀렉트',
    stockStatus: '바로 출고',
  },
  {
    id: 'ceramic-dripper-value',
    modelGroupId: 'model-ceramic-dripper',
    name: '백자 스톤웨어 핸드드립 서버 세트',
    brand: '여주 요업소',
    sellerName: '도자기 리빙 아울렛',
    category: '주방 · 테이블웨어',
    price: 52000,
    image: '/src/assets/images/product_ceramic_dripper_1795136455834.jpg',
    shortSpec: '동일 모델 최저가 B급·아울렛 특가 · 3~4일 배송',
    description:
      '동일한 여주 백자 핸드드립 세트를 미세 유약 차이 아울렛 특가로 가장 저렴하게 제공하는 상품입니다.',
    attributes: {
      material: '백자 스톤웨어 · 붕규산 유리',
      origin: '경기도 여주 창고 아울렛',
      isOverseasDirect: false,
      dimensions: '드리퍼 Ø115 × H95 mm (400ml)',
      sellerRating: 4.3,
      reviewCount: 175,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 상품 최저가', '무료 묶음 배송', '3~4일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (묶음 일반배송)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'aero-coldbrew-carafe',
    modelGroupId: 'model-coldbrew-bottle',
    name: '에어로 콜드브루 글래스 보틀',
    brand: '에어로 브루',
    sellerName: '에어로 브루 스토어',
    category: '주방 · 테이블웨어',
    price: 39000,
    image: '/src/assets/images/product_coldbrew_bottle_1795136456154.jpg',
    shortSpec: '붕규산 유리 · 영구 스테인리스 필터 · 무료배송',
    description:
      '냉장고 도어에 깔끔하게 들어가는 슬림한 1~2인용 콜드브루 카라페입니다. 분리 세척이 간편한 영구 메쉬 필터가 포함됩니다.',
    attributes: {
      material: '붕규산 내열 유리 · 식품용 실리콘',
      origin: '대한민국 성수동 스튜디오',
      isOverseasDirect: false,
      dimensions: 'Ø88 × H215 mm (650ml)',
      sellerRating: 4.5,
      reviewCount: 430,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['종이 필터 불필요 영구 메쉬', '슬림 냉장고 도어 핏', '무료 익일배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 무료배송)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 6. 식품 · 프리미엄 식음료 (신규 카테고리 · 동일 원두 3종 + 제주 말차)
  // =========================================================================
  {
    id: 'yirgacheffe-official',
    modelGroupId: 'model-yirgacheffe-coffee',
    name: '에티오피아 예가체프 스페셜티 원두 500g',
    brand: '로스터리 서울',
    sellerName: '로스터리 서울 직영로스터스',
    category: '식품 · 프리미엄 식음료',
    price: 32000,
    image: '/src/assets/images/product_specialty_coffee_1795404523007.jpg',
    shortSpec: '주문 당일 로스팅 · 별점 4.9 · 1일 새벽배송',
    description:
      '베르가못과 재스민 향이 화사하게 퍼지는 워시드 예가체프 G1 싱글오리진 원두입니다. 주문 직후 로스팅하여 1일 내 새벽 직배송합니다.',
    attributes: {
      material: '100% 에티오피아 예가체프 G1 아라비카',
      origin: '에티오피아 산지 · 서울 성수 당일 로스팅',
      isOverseasDirect: false,
      dimensions: '500g 아로마 밸브 파우치',
      sellerRating: 4.9,
      reviewCount: 2410,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['당일 로스팅 신선도 보장', '별점 4.9 공식 로스터리', '1일 내 새벽 도착 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (당일 로스팅 새벽)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식 직영',
    stockStatus: '바로 출고',
  },
  {
    id: 'yirgacheffe-balanced',
    modelGroupId: 'model-yirgacheffe-coffee',
    name: '에티오피아 예가체프 스페셜티 원두 500g',
    brand: '로스터리 서울',
    sellerName: '빈스마켓 인증셀러',
    category: '식품 · 프리미엄 식음료',
    price: 25500,
    image: '/src/assets/images/product_specialty_coffee_1795404523007.jpg',
    shortSpec: '가격·별점·배송 균형 중간값 · 1~2일 익일택배',
    description:
      '동일한 예가체프 G1 스페셜티 원두를 합리적 가격과 1~2일 내 익일 배송, 안정적인 별점 4.6으로 제공하는 인증 파트너 상품입니다.',
    attributes: {
      material: '100% 에티오피아 예가체프 G1 아라비카',
      origin: '대한민국 경기도 로스팅 팩토리',
      isOverseasDirect: false,
      dimensions: '500g 아로마 밸브 파우치',
      sellerRating: 4.6,
      reviewCount: 890,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간 옵션', '주 3회 정기 로스팅', '1~2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 표준 택배)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'yirgacheffe-value',
    modelGroupId: 'model-yirgacheffe-coffee',
    name: '에티오피아 예가체프 스페셜티 원두 500g',
    brand: '로스터리 서울',
    sellerName: '원두 도매직판 셀러',
    category: '식품 · 프리미엄 식음료',
    price: 20500,
    image: '/src/assets/images/product_specialty_coffee_1795404523007.jpg',
    shortSpec: '동일 원두 최저가 특가 · 3~4일 일반 묶음배송',
    description:
      '동일한 예가체프 원두를 대량 로스팅 도매가로 가장 저렴하게 제공하는 가성비 특가 상품입니다.',
    attributes: {
      material: '100% 에티오피아 예가체프 아라비카',
      origin: '대한민국 인천 대량 로스팅',
      isOverseasDirect: false,
      dimensions: '500g 파우치',
      sellerRating: 4.2,
      reviewCount: 310,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 원두 최저가', '무료 알뜰 배송', '3~4일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (알뜰 묶음배송)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'jeju-ceremonial-matcha',
    modelGroupId: 'model-jeju-matcha',
    name: '제주 유기농 세레모니얼 첫물 말차 100g',
    brand: '다원 제주',
    sellerName: '다원 제주 공식스토어',
    category: '식품 · 프리미엄 식음료',
    price: 34000,
    image: '/src/assets/images/product_specialty_coffee_1795404523007.jpg',
    shortSpec: '유기농 첫물 찻잎 100% · 차광 재배 · 1~2일 배송',
    description:
      '제주 한라산 기슭에서 차광 재배한 봄 첫물 찻잎만을 맷돌로 곱게 갈아낸 세레모니얼 등급 유기농 말차 파우더입니다.',
    attributes: {
      material: '유기농 제주 녹차 첫물 100%',
      origin: '대한민국 제주특별자치도',
      isOverseasDirect: false,
      dimensions: '100g 알루미늄 밀폐 캔',
      sellerRating: 4.8,
      reviewCount: 970,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['유기농 인증 찻잎', '풍부한 우마미 감칠맛', '1~2일 산지 직송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (제주 직송)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 7. 홈 리빙 · 프래그런스 (동일 디퓨저 3종 + 주방세제)
  // =========================================================================
  {
    id: 'hinoki-cypress-diffuser',
    modelGroupId: 'model-hinoki-diffuser',
    name: '히노끼 네추럴 우드 룸 디퓨저',
    brand: '보타니카 서울',
    sellerName: '보타니카 서울 공식관',
    category: '홈 리빙 · 프래그런스',
    price: 68000,
    image: '/src/assets/images/product_hinoki_diffuser_1795136456163.jpg',
    shortSpec: '공식 조향 스튜디오 · 편백 증류 100% · 1일 새벽배송',
    description:
      '인공 향료와 에탄올을 배제하고 순수 편백나무 수증기 증류 오일만을 블렌딩한 공식 스토어 직영 룸 디퓨저입니다.',
    attributes: {
      material: '갈색 차광 유리 · 천연 편백 우드',
      origin: '대한민국 전남 장성 편백림',
      isOverseasDirect: false,
      dimensions: 'Ø68 × H180 mm (150ml)',
      sellerRating: 4.9,
      reviewCount: 1680,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['별점 4.9 공식 스토어', '100% 편백 수증기 증류', '1일 내 새벽 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'direct-quiet', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽 배송)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식관',
    stockStatus: '바로 출고',
  },
  {
    id: 'hinoki-diffuser-balanced',
    modelGroupId: 'model-hinoki-diffuser',
    name: '히노끼 네추럴 우드 룸 디퓨저',
    brand: '보타니카 서울',
    sellerName: '센트 리빙 셀렉트',
    category: '홈 리빙 · 프래그런스',
    price: 56000,
    image: '/src/assets/images/product_hinoki_diffuser_1795136456163.jpg',
    shortSpec: '가격·신뢰성 균형 중간값 · 2일 표준 익일배송',
    description:
      '동일한 히노끼 네추럴 우드 룸 디퓨저 정품으로, 합리적 가격과 4.6 별점, 2일 내 안정 배송을 갖춘 중간값 옵션입니다.',
    attributes: {
      material: '갈색 차광 유리 · 천연 편백 우드',
      origin: '대한민국 서울 셀렉트 물류',
      isOverseasDirect: false,
      dimensions: 'Ø68 × H180 mm (150ml)',
      sellerRating: 4.6,
      reviewCount: 640,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간값', '천연 식물성 베이스', '2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '2일 소요 (표준 익일 택배)',
    estimatedArrivalText: '2일 소요 · 배송비 2,500원 · 셀렉트',
    stockStatus: '바로 출고',
  },
  {
    id: 'hinoki-diffuser-value',
    modelGroupId: 'model-hinoki-diffuser',
    name: '히노끼 네추럴 우드 룸 디퓨저',
    brand: '보타니카 서울',
    sellerName: '프래그런스 알뜰창고',
    category: '홈 리빙 · 프래그런스',
    price: 44000,
    image: '/src/assets/images/product_hinoki_diffuser_1795136456163.jpg',
    shortSpec: '동일 모델 벌크 무포장 최저가 · 3~4일 배송',
    description:
      '선물용 박스를 제외한 간소화 포장으로 동일한 히노끼 디퓨저를 최저가로 제공하는 실속 상품입니다.',
    attributes: {
      material: '갈색 차광 유리 · 천연 편백 우드',
      origin: '대한민국 물류센터 직출고',
      isOverseasDirect: false,
      dimensions: 'Ø68 × H180 mm (150ml)',
      sellerRating: 4.3,
      reviewCount: 220,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 디퓨저 최저가', '무료 일반 배송', '3~4일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (알뜰 일반배송)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'plant-unscented-detergent',
    modelGroupId: 'model-plant-detergent',
    name: '플랜트 베이스드 무향 주방 세제 리필 2입',
    brand: '퓨어 리빙 랩',
    sellerName: '퓨어 리빙 랩 공식몰',
    category: '홈 리빙 · 프래그런스',
    price: 24000,
    image: '/src/assets/images/product_eco_detergent_1795136456055.jpg',
    shortSpec: 'EWG 그린등급 · 완전 무향 · 알뜰 무료배송',
    description:
      '민감성 피부와 유아 식기에도 안심하고 사용할 수 있는 완전 무향 식물성 주방 세제입니다.',
    attributes: {
      material: '식물성 계면활성제 · 크라프트 파우치',
      origin: '대한민국 파주 친환경 팩토리',
      isOverseasDirect: false,
      dimensions: '500ml × 2팩 (총 1L)',
      sellerRating: 4.5,
      reviewCount: 2310,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['100% 무향 저자극', '생분해 99% 식물 성분', '무료 익일·EV 배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (무료 익일)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 8. 패션 · 데일리 잡화 (동일 백팩 3종 + 카드지갑)
  // =========================================================================
  {
    id: 'cordura-commuter-backpack',
    modelGroupId: 'model-cordura-backpack',
    name: '코듀라 발수 미니멀 노트북 백팩 18L',
    brand: '모드 기어',
    sellerName: '모드 기어 공식플래그십',
    category: '패션 · 데일리 잡화',
    price: 148000,
    image: '/src/assets/images/product_cordura_backpack_1795138391703.jpg',
    shortSpec: '공식 정품 평생 수선 · 별점 4.9 · 1일 새벽배송',
    description:
      '탄탄한 내구성의 1000D 코듀라 원단과 YKK 지수 지퍼를 적용해 비 오는 날에도 전자기기를 안전하게 보호하는 공식 스토어 백팩입니다.',
    attributes: {
      material: '1000D 코듀라 발수 나일론 · YKK 지퍼',
      origin: '대한민국 서울 공식 생산',
      isOverseasDirect: false,
      dimensions: '440 × 300 × 150 mm (18L)',
      sellerRating: 4.9,
      reviewCount: 1390,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['공식 정품 수선 보증', '별점 4.9 최상위 평점', '1일 내 새벽 도착 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽·익일)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식관',
    stockStatus: '바로 출고',
  },
  {
    id: 'cordura-backpack-balanced',
    modelGroupId: 'model-cordura-backpack',
    name: '코듀라 발수 미니멀 노트북 백팩 18L',
    brand: '모드 기어',
    sellerName: '어반백 파트너스토어',
    category: '패션 · 데일리 잡화',
    price: 124000,
    image: '/src/assets/images/product_cordura_backpack_1795138391703.jpg',
    shortSpec: '가격·별점·배송 균형 중간값 · 2일 익일택배',
    description:
      '동일한 코듀라 18L 백팩 정식 유통 상품으로, 합리적 가격과 4.6 평점, 2일 소요 익일 배송의 균형을 맞췄습니다.',
    attributes: {
      material: '1000D 코듀라 발수 나일론 · YKK 지퍼',
      origin: '대한민국 서울 공인 파트너',
      isOverseasDirect: false,
      dimensions: '440 × 300 × 150 mm (18L)',
      sellerRating: 4.6,
      reviewCount: 580,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3000,
      highlights: ['가격·신뢰성 균형 중간 옵션', '16인치 노트북 수납', '2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '2일 소요 (표준 익일)',
    estimatedArrivalText: '2일 소요 · 배송비 3,000원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'cordura-backpack-value',
    modelGroupId: 'model-cordura-backpack',
    name: '코듀라 발수 미니멀 노트북 백팩 18L',
    brand: '모드 기어',
    sellerName: '트래블기어 알뜰직판',
    category: '패션 · 데일리 잡화',
    price: 98000,
    image: '/src/assets/images/product_cordura_backpack_1795138391703.jpg',
    shortSpec: '동일 모델 최저가 아울렛 · 3~5일 일반배송',
    description:
      '동일한 코듀라 18L 백팩을 시즌 이월 재고 특가로 가장 저렴하게 제공하는 셀러입니다.',
    attributes: {
      material: '1000D 코듀라 발수 나일론 · YKK 지퍼',
      origin: '이월 물류창고 직출고',
      isOverseasDirect: false,
      dimensions: '440 × 300 × 150 mm (18L)',
      sellerRating: 4.3,
      reviewCount: 205,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 백팩 최저가', '무료 일반 묶음배송', '3~5일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 5,
    deliveryPeriodLabel: '3~5일 소요 (일반 묶음)',
    estimatedArrivalText: '3~5일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'vegetable-leather-wallet',
    modelGroupId: 'model-leather-wallet',
    name: '베지터블 풀그레인 가죽 슬림 카드지갑',
    brand: '아틀리에 크래프트',
    sellerName: '아틀리에 크래프트 공방',
    category: '패션 · 데일리 잡화',
    price: 59000,
    image: '/src/assets/images/product_leather_wallet_1795138391269.jpg',
    shortSpec: '이탈리아 베지터블 가죽 · 카드 6매 · 무료배송',
    description:
      '시간이 지날수록 자연스러운 에이징이 더해지는 이탈리아 토스카나 산 베지터블 태닝 소가죽 슬림 카드 월렛입니다.',
    attributes: {
      material: '이탈리아 풀그레인 베지터블 레더',
      origin: '이탈리아 원피 · 서울 성수 제작',
      isOverseasDirect: false,
      dimensions: '102 × 78 × 8 mm',
      sellerRating: 4.7,
      reviewCount: 510,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['천연 에이징 풀그레인 가죽', 'RFID 스키밍 차단 안감', '무료 익일·새벽 배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (무료 익일)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 9. 뷰티 · 퍼스널 케어 (동일 클렌저 세트 3종)
  // =========================================================================
  {
    id: 'calm-amber-skincare-set',
    modelGroupId: 'model-amber-cleanser',
    name: '약산성 앰버 젤 클렌저 & 시어 핸드밤 듀오',
    brand: '캄 보타닉스',
    sellerName: '캄 보타닉스 공식몰',
    category: '뷰티 · 퍼스널 케어',
    price: 48000,
    image: '/src/assets/images/product_amber_cleanser_1795138391585.jpg',
    shortSpec: '공식 정품 최신 제조분 · 별점 4.9 · 1일 새벽배송',
    description:
      '세안 후 당김이 없는 아미노산 유래 약산성 젤 클렌저(200ml)와 시어버터 핸드밤(75ml) 최신 제조 공식 스토어 정품입니다.',
    attributes: {
      material: '아미노산 계면활성제 · 유기농 시어버터',
      origin: '대한민국 제주 공식 연구소',
      isOverseasDirect: false,
      dimensions: '200ml + 75ml 세트',
      sellerRating: 4.9,
      reviewCount: 2120,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['최신 제조일자 100% 보장', '별점 4.9 최다 리뷰', '1일 내 새벽 도착 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽 배송)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식몰',
    stockStatus: '바로 출고',
  },
  {
    id: 'amber-cleanser-balanced',
    modelGroupId: 'model-amber-cleanser',
    name: '약산성 앰버 젤 클렌저 & 시어 핸드밤 듀오',
    brand: '캄 보타닉스',
    sellerName: '클린뷰티 큐레이션몰',
    category: '뷰티 · 퍼스널 케어',
    price: 39500,
    image: '/src/assets/images/product_amber_cleanser_1795138391585.jpg',
    shortSpec: '가격·별점·배송기간 균형 중간값 · 1~2일 택배',
    description:
      '동일한 약산성 젤 클렌저 & 핸드밤 듀오 정품으로, 합리적인 할인 가격과 4.6 평점, 1~2일 내 익일 배송을 제공합니다.',
    attributes: {
      material: '아미노산 계면활성제 · 유기농 시어버터',
      origin: '대한민국 서울 인증 뷰티몰',
      isOverseasDirect: false,
      dimensions: '200ml + 75ml 세트',
      sellerRating: 4.6,
      reviewCount: 870,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간값', '피부 저자극 정품 인증', '1~2일 소요 익일 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 택배)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'amber-cleanser-value',
    modelGroupId: 'model-amber-cleanser',
    name: '약산성 앰버 젤 클렌저 & 시어 핸드밤 듀오',
    brand: '캄 보타닉스',
    sellerName: '코스메틱 창고할인셀러',
    category: '뷰티 · 퍼스널 케어',
    price: 31500,
    image: '/src/assets/images/product_amber_cleanser_1795138391585.jpg',
    shortSpec: '동일 세트 최저가 대량할인 · 3~4일 배송',
    description:
      '동일한 약산성 클렌저 & 핸드밤 듀오를 박스 패키징을 생략해 최저가로 판매하는 실속 상품입니다.',
    attributes: {
      material: '아미노산 계면활성제 · 유기농 시어버터',
      origin: '국내 도매 물류창고',
      isOverseasDirect: false,
      dimensions: '200ml + 75ml 세트',
      sellerRating: 4.2,
      reviewCount: 260,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 상품 최저가', '무료 알뜰 배송', '3~4일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (일반 배송)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 10. 스포츠 · 아웃도어 · 캠핑 (신규 카테고리 · 동일 티타늄 3종 + 요가 매트)
  // =========================================================================
  {
    id: 'titanium-tumbler-official',
    modelGroupId: 'model-titanium-tumbler',
    name: '초경량 티타늄 진공 플라스크 & 캠핑 랜턴 세트',
    brand: '아웃포스트',
    sellerName: '아웃포스트 코리아 공식관',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 98000,
    image: '/src/assets/images/product_titanium_tumbler_1795404523032.jpg',
    shortSpec: '공식 정품 3년 보증 · 별점 4.9 · 1일 새벽배송',
    description:
      '더블월 순수 티타늄 보온 플라스크(600ml)와 아노다이징 방수 캠핑 랜턴 공식 스토어 정품 세트입니다.',
    attributes: {
      material: 'GR1 순수 티타늄 · 6061 알루미늄 랜턴',
      origin: '대한민국 서울 공식 출고',
      isOverseasDirect: false,
      dimensions: '플라스크 600ml + 랜턴 Ø75 × 150 mm',
      sellerRating: 4.9,
      reviewCount: 1450,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['별점 4.9 공식 브랜드관', 'IPX6 생활방수 무상 보증', '1일 내 새벽 도착 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽·익일)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식관',
    stockStatus: '바로 출고',
  },
  {
    id: 'titanium-tumbler-balanced',
    modelGroupId: 'model-titanium-tumbler',
    name: '초경량 티타늄 진공 플라스크 & 캠핑 랜턴 세트',
    brand: '아웃포스트',
    sellerName: '캠핑기어 인증파트너',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 81000,
    image: '/src/assets/images/product_titanium_tumbler_1795404523032.jpg',
    shortSpec: '가격·신뢰성 균형 중간 옵션 · 2일 표준 택배',
    description:
      '동일한 티타늄 플라스크 & 랜턴 세트로, 합리적 판매가와 4.6 별점, 2일 소요 익일 택배의 균형을 제공합니다.',
    attributes: {
      material: 'GR1 순수 티타늄 · 6061 알루미늄 랜턴',
      origin: '대한민국 경기 공인 대리점',
      isOverseasDirect: false,
      dimensions: '플라스크 600ml + 랜턴 Ø75 × 150 mm',
      sellerRating: 4.6,
      reviewCount: 610,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3000,
      highlights: ['가격·신뢰성 균형 중간값', '공인 대리점 정품', '2일 소요 표준 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '2일 소요 (표준 택배)',
    estimatedArrivalText: '2일 소요 · 배송비 3,000원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'titanium-tumbler-value',
    modelGroupId: 'model-titanium-tumbler',
    name: '초경량 티타늄 진공 플라스크 & 캠핑 랜턴 세트',
    brand: '아웃포스트',
    sellerName: '아웃도어 해외직구 특가',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 65000,
    image: '/src/assets/images/product_titanium_tumbler_1795404523032.jpg',
    shortSpec: '동일 세트 최저가 해외직구 · 4~5일 소요',
    description:
      '동일한 티타늄 플라스크 & 캠핑 랜턴 세트를 해외 직배송 최저가로 판매하는 특가 셀러입니다.',
    attributes: {
      material: 'GR1 순수 티타늄 · 6061 알루미늄 랜턴',
      origin: '해외 직구 물류센터',
      isOverseasDirect: true,
      dimensions: '플라스크 600ml + 랜턴 Ø75 × 150 mm',
      sellerRating: 4.2,
      reviewCount: 190,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3500,
      highlights: ['동일 세트 최저가', '해외 직구 통관', '4~5일 소요'],
    },
    supportedDeliveries: ['overseas-express', 'bundle'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 4,
    deliveryDaysMax: 5,
    deliveryPeriodLabel: '4~5일 소요 (해외 직구)',
    estimatedArrivalText: '4~5일 소요 · 배송비 3,500원 · 최저가',
    stockStatus: '해외 직배송',
  },
  {
    id: 'cork-grip-yoga-mat',
    modelGroupId: 'model-cork-yoga-mat',
    name: '천연 코르크 & 천연고무 논슬립 요가 매트 6mm',
    brand: '발란스 스튜디오',
    sellerName: '발란스 스튜디오 공식',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 64000,
    image: '/src/assets/images/product_titanium_tumbler_1795404523032.jpg',
    shortSpec: '포르투갈 천연 코르크 · 6mm 쿠션 · 무료배송',
    description:
      '땀이 날수록 접지력이 높아지는 천연 코르크 상판과 밀림 없는 천연 고무 하판을 결합한 프리미엄 홈트·요가 매트입니다.',
    attributes: {
      material: '포르투갈 코르크 · 천연 고무',
      origin: '대한민국 서울',
      isOverseasDirect: false,
      dimensions: '1830 × 680 × 6 mm',
      sellerRating: 4.7,
      reviewCount: 530,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['친환경 PVC 프리 소재', '안정적 6mm 관절 보호', '무료 익일 배송'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (무료 익일)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 11. 문구 · 오피스 · 취미 (신규 카테고리 · 동일 만년필 3종 + 캘린더)
  // =========================================================================
  {
    id: 'brass-pen-official',
    modelGroupId: 'model-brass-pen',
    name: '솔리드 황동 만년필 & 리넨 양장 노트 세트',
    brand: '아틀리에 펜',
    sellerName: '아틀리에 펜 공식직영관',
    category: '문구 · 오피스 · 취미',
    price: 89000,
    image: '/src/assets/images/product_brass_fountain_pen_1795404523343.jpg',
    shortSpec: '독일 슈미트 F촉 검수 · 각인 서비스 · 1일 새벽배송',
    description:
      '시간이 흐르며 손때가 자연스럽게 길드는 솔리드 황동 바디 만년필과 180도 펼쳐지는 리넨 양장 노트 공식 직영 세트입니다.',
    attributes: {
      material: 'CNC 솔리드 황동 · 120g 만년필 전용지',
      origin: '대한민국 서울 공식 아틀리에',
      isOverseasDirect: false,
      dimensions: '만년필 138 mm + 노트 A5 (192p)',
      sellerRating: 4.9,
      reviewCount: 1340,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['장인 닙(촉) 개별 검수', '별점 4.9 최상위 평점', '1일 내 새벽 도착 무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽·익일)',
    estimatedArrivalText: '1일 내 도착 · 무료배송 · 공식관',
    stockStatus: '바로 출고',
  },
  {
    id: 'brass-pen-balanced',
    modelGroupId: 'model-brass-pen',
    name: '솔리드 황동 만년필 & 리넨 양장 노트 세트',
    brand: '아틀리에 펜',
    sellerName: '페이퍼랩 인증파트너',
    category: '문구 · 오피스 · 취미',
    price: 73500,
    image: '/src/assets/images/product_brass_fountain_pen_1795404523343.jpg',
    shortSpec: '가격·신뢰성 균형 중간값 · 1~2일 익일 택배',
    description:
      '동일한 솔리드 황동 만년필 & 리넨 양장 노트 정품 세트로, 합리적인 판매가와 별점 4.6, 1~2일 표준 배송의 균형을 갖췄습니다.',
    attributes: {
      material: 'CNC 솔리드 황동 · 120g 만년필 전용지',
      origin: '대한민국 파주 공식 파트너',
      isOverseasDirect: false,
      dimensions: '만년필 138 mm + 노트 A5 (192p)',
      sellerRating: 4.6,
      reviewCount: 530,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['가격·신뢰성 균형 중간값', '리넨 노트 합본 구성', '1~2일 소요 익일 택배'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일 택배)',
    estimatedArrivalText: '1~2일 소요 · 배송비 2,500원 · 파트너',
    stockStatus: '바로 출고',
  },
  {
    id: 'brass-pen-value',
    modelGroupId: 'model-brass-pen',
    name: '솔리드 황동 만년필 & 리넨 양장 노트 세트',
    brand: '아틀리에 펜',
    sellerName: '스테이셔너리 알뜰셀러',
    category: '문구 · 오피스 · 취미',
    price: 59000,
    image: '/src/assets/images/product_brass_fountain_pen_1795404523343.jpg',
    shortSpec: '동일 세트 최저가 · 3~4일 일반 묶음배송',
    description:
      '동일한 솔리드 황동 만년필 & 리넨 노트 세트를 선물 케이스 없이 최저가 실속 구성으로 판매하는 상품입니다.',
    attributes: {
      material: 'CNC 솔리드 황동 · 120g 만년필 전용지',
      origin: '국내 문구 도매 물류',
      isOverseasDirect: false,
      dimensions: '만년필 138 mm + 노트 A5 (192p)',
      sellerRating: 4.3,
      reviewCount: 165,
      isOfficialSeller: false,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['동일 세트 최저가', '무료 묶음 배송', '3~4일 소요'],
    },
    supportedDeliveries: ['bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 3,
    deliveryDaysMax: 4,
    deliveryPeriodLabel: '3~4일 소요 (일반 묶음)',
    estimatedArrivalText: '3~4일 소요 · 무료배송 · 최저가',
    stockStatus: '바로 출고',
  },
  {
    id: 'letterpress-desk-calendar',
    modelGroupId: 'model-desk-calendar',
    name: '월넛 스탠드 레터프레스 데스크 캘린더',
    brand: '타입 프레스',
    sellerName: '타입 프레스 직영',
    category: '문구 · 오피스 · 취미',
    price: 36000,
    image: '/src/assets/images/product_brass_fountain_pen_1795404523343.jpg',
    shortSpec: '수입 350g 코튼지 · 천연 월넛 원목 · 무료배송',
    description:
      '활판 인쇄의 깊은 음각 질감이 살아있는 코튼지 캘린더 카드와 원목 거치대 세트입니다.',
    attributes: {
      material: '북미산 월넛 원목 · 350g 코튼지',
      origin: '대한민국 충무로 인쇄공방',
      isOverseasDirect: false,
      dimensions: '140 × 190 × 35 mm',
      sellerRating: 4.6,
      reviewCount: 410,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['활판 레터프레스 음각', '무료 익일 배송', '원목 거치대 포함'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (무료 익일)',
    estimatedArrivalText: '1~2일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },

  // =========================================================================
  // 12. 주류 · 성인 전용 기호품 (만 19세 미만 구매 불가 · 동일 위스키 비교 + 소주)
  // =========================================================================
  {
    id: 'single-malt-whisky-12y',
    modelGroupId: 'model-whisky-12y',
    name: '스페이사이드 더블우드 12년 싱글몰트 위스키 700ml',
    brand: '하일랜드 캐스크',
    sellerName: '하일랜드 공식주류관',
    category: '주류 · 성인 전용 기호품',
    price: 124000,
    image: '/src/assets/images/product_single_malt_whisky_1795138390937.jpg',
    shortSpec: '정식 수입 공식 홀로그램 · 별점 4.9 · 2일 지정 성인배송',
    description:
      '버번 오크와 셰리 캐스크에서 숙성해 꿀과 바닐라, 스파이스 풍미를 지닌 12년 싱글몰트 스카치 위스키 공식 주류관 정품입니다. 만 19세 미만 미성년자는 구매할 수 없습니다.',
    attributes: {
      material: '싱글몰트 스카치 위스키 (40% ABV · 700ml)',
      origin: '영국 스코틀랜드 정식 수입',
      isOverseasDirect: false,
      dimensions: '700ml 병입',
      sellerRating: 4.9,
      reviewCount: 1120,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      isAgeRestricted: true,
      ageRestrictionReason: '청소년보호법상 만 19세 미만 미성년자 판매 금지 품목 (주류)',
      highlights: ['공식 수입 정품 인증', '별점 4.9 최상위 신뢰도', '2일 내 지정 성인 대면 배송'],
    },
    supportedDeliveries: ['scheduled', 'next-day'],
    supportedHandoffs: ['direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (성인 대면 확인)',
    estimatedArrivalText: '1~2일 소요 · 무료 성인 확인 배송',
    stockStatus: '성인 인증 필수',
  },
  {
    id: 'single-malt-whisky-12y-balanced',
    modelGroupId: 'model-whisky-12y',
    name: '스페이사이드 더블우드 12년 싱글몰트 위스키 700ml',
    brand: '하일랜드 캐스크',
    sellerName: '리쿼셀렉트 인증파트너',
    category: '주류 · 성인 전용 기호품',
    price: 108000,
    image: '/src/assets/images/product_single_malt_whisky_1795138390937.jpg',
    shortSpec: '가격·별점·배송 균형 중간 옵션 · 2~3일 성인배송',
    description:
      '동일한 스페이사이드 12년 싱글몰트 위스키 정품으로, 합리적인 가격과 별점 4.6, 2~3일 내 성인 확인 배송을 균형 있게 제공합니다.',
    attributes: {
      material: '싱글몰트 스카치 위스키 (40% ABV · 700ml)',
      origin: '영국 스코틀랜드 공인 유통',
      isOverseasDirect: false,
      dimensions: '700ml 병입',
      sellerRating: 4.6,
      reviewCount: 490,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3500,
      isAgeRestricted: true,
      ageRestrictionReason: '청소년보호법상 만 19세 미만 미성년자 판매 금지 품목 (주류)',
      highlights: ['가격·신뢰성 균형 중간값', '공인 주류 파트너사', '2~3일 소요 성인 확인 배송'],
    },
    supportedDeliveries: ['scheduled', 'next-day'],
    supportedHandoffs: ['direct-quiet'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (성인 확인 배송)',
    estimatedArrivalText: '2~3일 소요 · 배송비 3,500원 · 파트너',
    stockStatus: '성인 인증 필수',
  },
  {
    id: 'single-malt-whisky-12y-value',
    modelGroupId: 'model-whisky-12y',
    name: '스페이사이드 더블우드 12년 싱글몰트 위스키 700ml',
    brand: '하일랜드 캐스크',
    sellerName: '해외직구 면세특가 셀러',
    category: '주류 · 성인 전용 기호품',
    price: 92000,
    image: '/src/assets/images/product_single_malt_whisky_1795138390937.jpg',
    shortSpec: '동일 위스키 최저가 해외직배송 · 4~6일 소요',
    description:
      '동일한 12년 싱글몰트 위스키를 해외 면세 직구 최저가로 판매하는 상품입니다. 통관 포함 4~6일이 소요됩니다.',
    attributes: {
      material: '싱글몰트 스카치 위스키 (40% ABV · 700ml)',
      origin: '영국/유럽 해외 직구',
      isOverseasDirect: true,
      dimensions: '700ml 병입',
      sellerRating: 4.3,
      reviewCount: 160,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 6000,
      isAgeRestricted: true,
      ageRestrictionReason: '청소년보호법상 만 19세 미만 미성년자 판매 금지 품목 (주류)',
      highlights: ['동일 모델 최저가 직구', '해외 성인 인증 통관', '4~6일 소요'],
    },
    supportedDeliveries: ['overseas-express', 'scheduled'],
    supportedHandoffs: ['direct-quiet'],
    deliveryDaysMin: 4,
    deliveryDaysMax: 6,
    deliveryPeriodLabel: '4~6일 소요 (해외 성인 통관)',
    estimatedArrivalText: '4~6일 소요 · 배송비 6,000원 · 최저가',
    stockStatus: '성인 인증 필수',
  },
  {
    id: 'andong-ceramic-soju-45',
    modelGroupId: 'model-andong-soju',
    name: '안동 화회 백자 병입 증류식 전통 소주 45% (500ml)',
    brand: '화회 양조장',
    sellerName: '화회 양조장 직영',
    category: '주류 · 성인 전용 기호품',
    price: 54000,
    image: '/src/assets/images/product_korean_soju_1795138391217.jpg',
    shortSpec: '알코올 45% · 100% 국내산 쌀 증류 · 무료배송',
    description:
      '경북 안동 맑은 물과 국내산 햅쌀로 상압 증류한 뒤 1년간 옹기 숙성한 45도 전통 증류식 소주입니다. 만 19세 미만 미성년자는 구매할 수 없습니다.',
    attributes: {
      material: '증류식 소주 (45% ABV · 백자 도자기 병)',
      origin: '대한민국 경상북도 안동',
      isOverseasDirect: false,
      dimensions: '500ml 도자기 병',
      sellerRating: 4.7,
      reviewCount: 640,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      isAgeRestricted: true,
      ageRestrictionReason: '청소년보호법상 만 19세 미만 미성년자 판매 금지 품목 (전통주 · 고도수 주류)',
      highlights: ['성인(만 19세 이상) 전용', '옹기 장기 숙성', '무료 성인 확인 배송'],
    },
    supportedDeliveries: ['scheduled', 'next-day'],
    supportedHandoffs: ['direct-quiet'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (성인 확인 배송)',
    estimatedArrivalText: '2~3일 소요 · 무료 성인 확인 배송',
    stockStatus: '성인 인증 필수',
  },

  // =========================================================================
  // 확장 상품군 (카테고리별 4개 이상 상품군 구성을 위한 추가 라인업)
  // =========================================================================
  {
    id: 'alumin-usbc-hub-8in1',
    modelGroupId: 'model-usbc-hub',
    name: '아노다이징 알루미늄 USB-C 8-in-1 PD 100W 멀티허브',
    brand: '포트랩 코리아',
    sellerName: '포트랩 공식스토어',
    category: '컴퓨터 · 주변기기',
    price: 69000,
    image: '/src/assets/images/product_usbc_monitor_hub_1795478160817.jpg',
    shortSpec: '4K 60Hz HDMI · PD 100W 패스스루 · SD/TF 동시 리더',
    description:
      'CNC 가공 알루미늄 바디로 발열을 빠르게 분산시키며 노트북 단일 포트를 8개 확장 포트로 연결하는 고속 도킹 허브입니다.',
    attributes: {
      material: '아노다이징 알루미늄 · 브레이드 나일론 케이블',
      origin: '대한민국 설계 / 대만 제조',
      isOverseasDirect: false,
      dimensions: '128 × 46 × 14 mm',
      sellerRating: 4.9,
      reviewCount: 742,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['4K 60Hz HDMI 출력', 'PD 100W 고속 충전', '무료 새벽배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽배송)',
    estimatedArrivalText: '내일 오전 7시 전 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'alumin-usbc-hub-8in1-budget',
    modelGroupId: 'model-usbc-hub',
    name: '아노다이징 알루미늄 USB-C 8-in-1 PD 100W 멀티허브',
    brand: '포트랩 코리아',
    sellerName: '디지털팩토리 최저가몰',
    category: '컴퓨터 · 주변기기',
    price: 54000,
    image: '/src/assets/images/product_usbc_monitor_hub_1795478160817.jpg',
    shortSpec: '실속 벌크 패키지 · 기본 택배 2~3일 · 최저가',
    description:
      '동일 8-in-1 알루미늄 허브 본품에 크라프트 벌크 포장을 적용해 가격 부담을 낮춘 실속 구매 옵션입니다.',
    attributes: {
      material: '아노다이징 알루미늄 · 브레이드 나일론 케이블',
      origin: '병행 유통 정품',
      isOverseasDirect: false,
      dimensions: '128 × 46 × 14 mm',
      sellerRating: 4.3,
      reviewCount: 215,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['판매처 최저가', 'PD 100W 지원', '크라프트 실속 포장'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (일반 택배)',
    estimatedArrivalText: '2~3일 소요 · 배송비 2,500원',
    stockStatus: '바로 출고',
  },
  {
    id: 'silent-ergo-wireless-mouse',
    modelGroupId: 'model-ergo-mouse',
    name: '인체공학 무소음 마그네틱 휠 무선 마우스 (멀티페어링)',
    brand: '모노 타이핑',
    sellerName: '모노 타이핑 공식스토어',
    category: '컴퓨터 · 주변기기',
    price: 82000,
    image: '/src/assets/images/product_usbc_monitor_hub_1795478160817.jpg',
    shortSpec: '무소음 스위치 · 최대 3대 기기 전환 · USB-C 충전',
    description:
      '손목 비틀림을 줄이는 18도 경사 각도와 정숙한 무소음 클릭 스위치를 탑재해 도서관·야간 작업에 최적화한 무선 마우스입니다.',
    attributes: {
      material: '무광 ABS · 알루미늄 스크롤 휠',
      origin: '대한민국 서울',
      isOverseasDirect: false,
      dimensions: '114 × 72 × 44 mm (92g)',
      sellerRating: 4.8,
      reviewCount: 518,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['블루투스 3대 전환', '무소음 클릭 스위치', '70일 연속 사용'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'steam-garment-care-1500w',
    modelGroupId: 'model-handy-steamer',
    name: '20초 예열 고압 핸디 스팀다리미 1500W (세라믹 열판)',
    brand: '리빙포어',
    sellerName: '리빙포어 공식 브랜드관',
    category: '생활 · 주방가전',
    price: 78000,
    image: '/src/assets/images/product_steel_kettle_1795136456275.jpg',
    shortSpec: '20초 고속 예열 · 연속 스팀 18분 · 세라믹 코팅 열판',
    description:
      '출근 전 바쁜 아침에도 셔츠와 코트 주름을 20초 예열 후 빠르게 펴주는 경량 고압 핸디 스팀다리미입니다.',
    attributes: {
      material: '세라믹 코팅 열판 · 내열 폴리카보네이트',
      origin: '대한민국 설계 / 중국 OEM',
      isOverseasDirect: false,
      dimensions: '142 × 105 × 268 mm',
      sellerRating: 4.7,
      reviewCount: 412,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['20초 초고속 예열', '260ml 분리형 물통', '1년 무상 A/S'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'quiet-bldc-circulator',
    modelGroupId: 'model-bldc-circulator',
    name: '초저소음 BLDC 무선 탁상 공기순환 써큘레이터',
    brand: '에어필름',
    sellerName: '에어필름 공식 브랜드몰',
    category: '생활 · 주방가전',
    price: 112000,
    image: '/src/assets/images/product_air_purifier_1795138391336.jpg',
    shortSpec: '19dB 초저소음 · 360도 입체 회전 · C타입 무선 16시간',
    description:
      '수면과 업무를 방해하지 않는 19dB BLDC 모터와 완전 분리 세척 안전망을 갖춘 사계절 실내 공기순환 써큘레이터입니다.',
    attributes: {
      material: '무광 매트 ABS · 알루미늄 스탠드',
      origin: '대한민국 서울',
      isOverseasDirect: false,
      dimensions: '215 × 215 × 310 mm',
      sellerRating: 4.8,
      reviewCount: 625,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['19dB 수면 저소음', '무선 최대 16시간', '분리 물세척 안전망'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽배송)',
    estimatedArrivalText: '내일 오전 7시 전 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'desk-usb-dac-amp',
    modelGroupId: 'model-usb-dac',
    name: '스튜디오 레퍼런스 데스크 USB-C DAC 헤드폰 앰프',
    brand: '소노 스튜디오',
    sellerName: '소노 스튜디오 공식몰',
    category: '오디오 · 스마트 디바이스',
    price: 164000,
    image: '/src/assets/images/product_minimal_speaker_1795136456207.jpg',
    shortSpec: '32bit/384kHz PCM · 4.4mm 밸런스드 출력 · CNC 알루미늄',
    description:
      '노트북과 스마트폰의 디지털 오디오 신호를 정밀 아날로그 신호로 변환해 유선 헤드폰과 스피커의 해상력을 끌어올리는 데스크 앰프입니다.',
    attributes: {
      material: '아노다이징 통알루미늄 섀시',
      origin: '대한민국 서울',
      isOverseasDirect: false,
      dimensions: '108 × 88 × 26 mm',
      sellerRating: 4.9,
      reviewCount: 289,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['32bit/384kHz 지원', '듀얼 3.5/4.4mm 출력', '초저노이즈 설계'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'open-fit-bone-earphones',
    modelGroupId: 'model-bone-earphones',
    name: 'IP68 방수 오픈형 티타늄 골전도 러닝 이어폰',
    brand: '아크 사운드',
    sellerName: '스마트사운드 최저가샵',
    category: '오디오 · 스마트 디바이스',
    price: 118000,
    image: '/src/assets/images/product_anc_headphones_1795404523320.jpg',
    shortSpec: '26g 초경량 티타늄 · IP68 완전 방수 · 10시간 연속 재생',
    description:
      '야외 러닝과 사이클 시 주변 소리를 안전하게 인지하면서도 선명한 중저음을 전달하는 오픈형 티타늄 프레임 스포츠 이어폰입니다.',
    attributes: {
      material: '형상기억 티타늄 합금 · 메디컬 실리콘',
      origin: '해외 공식 수입',
      isOverseasDirect: false,
      dimensions: '26g 초경량 프리사이즈',
      sellerRating: 4.5,
      reviewCount: 446,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3000,
      highlights: ['IP68 방수/방진', '26g 초경량 프레임', '주변 소리 인지 안전'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (일반 택배)',
    estimatedArrivalText: '2~3일 소요 · 배송비 3,000원',
    stockStatus: '바로 출고',
  },
  {
    id: 'ux-research-field-guide',
    modelGroupId: 'model-ux-field-guide',
    name: 'UX 리서치 실전 필드 가이드 (개정 증보 양장본)',
    brand: '아키텍처 프레스',
    sellerName: '아키텍처 북스 직영서점',
    category: '도서 · 매거진',
    price: 36000,
    image: '/src/assets/images/product_design_book_1795138391170.jpg',
    shortSpec: '412쪽 · 실사례 28편 · 무료배송 · 당일/익일 출고',
    description:
      '사용자 인터뷰 설계부터 사용성 테스트, 정량·정성 데이터 통합 분석까지 제품 팀이 즉시 적용할 수 있는 실무 리서치 지침서입니다.',
    attributes: {
      material: '120g 모조지 · 사철 양장 제본',
      origin: '대한민국 파주 인쇄',
      isOverseasDirect: false,
      dimensions: '158 × 225 mm (412쪽)',
      sellerRating: 4.9,
      reviewCount: 492,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['사철 제본 완독형', '현업 워크시트 부록', '당일 출고'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽/익일)',
    estimatedArrivalText: '내일 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'typography-archive-magazine',
    modelGroupId: 'model-type-magazine',
    name: '모던 브랜드 타이포그래피 & 그리드 아카이브 계간지',
    brand: '노드 프레스',
    sellerName: '노드 북스토어',
    category: '도서 · 매거진',
    price: 24000,
    image: '/src/assets/images/product_tech_book_1795138390752.jpg',
    shortSpec: '220쪽 풀컬러 아트지 · 해외/국내 스튜디오 인터뷰',
    description:
      '유럽과 아시아 독립 디자인 스튜디오들의 편집 그리드와 서체 활용 사례를 고해상도 지면으로 엮은 계간 디자인 매거진입니다.',
    attributes: {
      material: '스노우 화이트 130g · 무선 PUR 제본',
      origin: '대한민국 서울',
      isOverseasDirect: false,
      dimensions: '210 × 275 mm (220쪽)',
      sellerRating: 4.6,
      reviewCount: 168,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['풀컬러 아트지 인쇄', '스튜디오 사례집', '에어캡 안전 포장'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (일반 택배)',
    estimatedArrivalText: '2~3일 소요 · 배송비 2,500원',
    stockStatus: '바로 출고',
  },
  {
    id: 'cast-iron-dutch-oven-22-official',
    modelGroupId: 'model-cast-iron-pot',
    name: '에나멜 무쇠 주물 더치오븐 냄비 22cm (매트 차콜)',
    brand: '아틀리에 포지',
    sellerName: '아틀리에 포지 공식스토어',
    category: '주방 · 테이블웨어',
    price: 248000,
    image: '/src/assets/images/product_cast_iron_pot_1795478162438.jpg',
    shortSpec: '공식 정품 10년 보증 · 인덕션/오븐 호환 · 무료배송',
    description:
      '두꺼운 주물 바디와 자체 수분 순환 돌기 뚜껑으로 재료 본연의 깊은 맛을 끌어내는 22cm 에나멜 더치오븐입니다.',
    attributes: {
      material: '무쇠 주물 3중 매트 에나멜 코팅 · 스테인리스 노브',
      origin: '프랑스 제조 (공식 수입)',
      isOverseasDirect: false,
      dimensions: '지름 22cm · 3.3L (4.1kg)',
      sellerRating: 4.9,
      reviewCount: 834,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['공식 정품 10년 보증', '인덕션·오븐 겸용', '무료 새벽배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled'],
    supportedHandoffs: ['doorstep-photo', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (공식 빠른배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'cast-iron-dutch-oven-22-direct',
    modelGroupId: 'model-cast-iron-pot',
    name: '에나멜 무쇠 주물 더치오븐 냄비 22cm (매트 차콜)',
    brand: '아틀리에 포지',
    sellerName: '유럽 키친 직구셀러',
    category: '주방 · 테이블웨어',
    price: 189000,
    image: '/src/assets/images/product_cast_iron_pot_1795478162438.jpg',
    shortSpec: '유럽 현지 직배송 · 배송비 9,000원 · 가격 최저가',
    description:
      '유럽 현지 백화점 유통 정품을 항공 직배송으로 합리적인 가격에 제공하는 해외 직구 옵션입니다.',
    attributes: {
      material: '무쇠 주물 3중 매트 에나멜 코팅 · 스테인리스 노브',
      origin: '프랑스 (유럽 직배송)',
      isOverseasDirect: true,
      dimensions: '지름 22cm · 3.3L (4.1kg)',
      sellerRating: 4.2,
      reviewCount: 276,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 9000,
      highlights: ['직구 최저가 옵션', '유럽 현지 정품', '통관부호 자동 연계'],
    },
    supportedDeliveries: ['overseas-express'],
    supportedHandoffs: ['doorstep-photo', 'direct-quiet'],
    deliveryDaysMin: 4,
    deliveryDaysMax: 6,
    deliveryPeriodLabel: '4~6일 소요 (해외 직배송)',
    estimatedArrivalText: '4~6일 소요 · 배송비 9,000원 · 최저가',
    stockStatus: '해외 직배송',
  },
  {
    id: 'titanium-cutlery-4set',
    modelGroupId: 'model-titanium-cutlery',
    name: '브러쉬드 티타늄 4인 테이블 커트러리 12P 세트',
    brand: '여주 도예 공방',
    sellerName: '여주 공방 다이닝샵',
    category: '주방 · 테이블웨어',
    price: 64000,
    image: '/src/assets/images/product_ceramic_dripper_1795136455834.jpg',
    shortSpec: '초경량 티타늄 · 식기세척기 안전 · 무연마 자국 마감',
    description:
      '금속 비린내 없이 가볍고 부식에 강한 순수 티타늄 소재에 매트 브러쉬드 마감을 입힌 4인용 커트러리 세트입니다.',
    attributes: {
      material: 'Grade 1 순수 티타늄',
      origin: '대한민국',
      isOverseasDirect: false,
      dimensions: '스푼·포크·나이프 각 4P (총 12P)',
      sellerRating: 4.7,
      reviewCount: 318,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['식기세척기 가능', '금속취 없는 티타늄', '무료배송'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'osul-jeju-matcha-tin',
    modelGroupId: 'model-jeju-matcha',
    name: '제주 첫물 유기농 세레모니얼 말차 틴 (80g)',
    brand: '오설 다원',
    sellerName: '오설 다원 산지직송',
    category: '식품 · 프리미엄 식음료',
    price: 42000,
    image: '/src/assets/images/product_matcha_olive_set_1795478162594.jpg',
    shortSpec: '제주 100% 유기농 차광 재배 · 맷돌 분쇄 · 새벽/익일 배송',
    description:
      '제주 한라산 남측 다원에서 5월 첫물 찻잎만 차광 재배해 화강암 맷돌로 곱게 갈아낸 무첨가 세레모니얼 등급 말차입니다.',
    attributes: {
      material: '유기농 녹차 100% (이중 밀폐 틴케이스)',
      origin: '대한민국 제주특별자치도',
      isOverseasDirect: false,
      dimensions: '80g (약 40잔 분량)',
      sellerRating: 4.9,
      reviewCount: 685,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['제주 첫물 유기농', '부드러운 감칠맛', '무료 새벽배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (산지 새벽배송)',
    estimatedArrivalText: '내일 오전 7시 전 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'crete-coldpressed-olive-oil',
    modelGroupId: 'model-olive-oil',
    name: '크레타 단일 농장 냉압착 엑스트라버진 올리브오일 (500ml)',
    brand: '테라 올리브',
    sellerName: '테라 미식 공식스토어',
    category: '식품 · 프리미엄 식음료',
    price: 39000,
    image: '/src/assets/images/product_matcha_olive_set_1795478162594.jpg',
    shortSpec: '산도 0.18% 이하 · 코로네이키 단일 품종 · 차광 유리병',
    description:
      '수확 후 6시간 이내 24℃ 저온 냉압착으로 추출해 폴리페놀과 산뜻한 풀 향이 살아있는 프리미엄 엑스트라버진 올리브오일입니다.',
    attributes: {
      material: '유기농 엑스트라버진 올리브오일 100% (UV 차단 유리병)',
      origin: '그리스 크레타 섬 (정식 수입)',
      isOverseasDirect: false,
      dimensions: '500ml · 푸어러 캡 포함',
      sellerRating: 4.8,
      reviewCount: 512,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 3000,
      highlights: ['산도 0.18% 최고등급', '저온 냉압착 추출', '푸어러 캡 동봉'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 배송비 3,000원',
    stockStatus: '바로 출고',
  },
  {
    id: 'hotel-60s-cotton-bedding',
    modelGroupId: 'model-cotton-bedding',
    name: '호텔식 60수 사틴 고밀도 면 침구 풀세트 (퀸/화이트)',
    brand: '아틀리에 리넨',
    sellerName: '아틀리에 리넨 공식몰',
    category: '홈 리빙 · 프래그런스',
    price: 158000,
    image: '/src/assets/images/hero_curated_living_1795136456316.jpg',
    shortSpec: '60수 고밀도 순면 · 집먼지진드기 차단 · 무료배송',
    description:
      '사각거리는 호텔 침구 특유의 쾌적한 터치감과 통기성을 구현한 60수 고밀도 사틴 순면 이불커버·베개커버 세트입니다.',
    attributes: {
      material: '100% 수피마 60수 고밀도 면',
      origin: '대한민국 제작',
      isOverseasDirect: false,
      dimensions: '퀸 이불커버 200×230cm + 베개커버 2장',
      sellerRating: 4.9,
      reviewCount: 910,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['60수 고밀도 순면', 'OEKO-TEX 인증', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'basalt-incense-oil-set',
    modelGroupId: 'model-incense-holder',
    name: '제주 현무암 아로마 스톤 & 시더우드 오일 세트',
    brand: '소울 포레스트',
    sellerName: '소울 포레스트 공방',
    category: '홈 리빙 · 프래그런스',
    price: 38000,
    image: '/src/assets/images/product_hinoki_diffuser_1795136456163.jpg',
    shortSpec: '불 없이 발향 · 100% 천연 에센셜 오일 · 선물 포장',
    description:
      '다공성 제주 현무암 스톤에 천연 시더우드 에센셜 오일을 몇 방울 떨어뜨려 불이나 전기 없이 은은하게 발향하는 스톤 디퓨저입니다.',
    attributes: {
      material: '천연 현무암 스톤 · 스틸 트레이 · 에센셜 오일 15ml',
      origin: '대한민국 제주',
      isOverseasDirect: false,
      dimensions: '트레이 지름 110mm',
      sellerRating: 4.6,
      reviewCount: 284,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 2500,
      highlights: ['전기·불 없는 무전원 발향', '100% 천연 오일', '반영구 스톤'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (일반 택배)',
    estimatedArrivalText: '2~3일 소요 · 배송비 2,500원',
    stockStatus: '바로 출고',
  },
  {
    id: 'carbon-windproof-umbrella',
    modelGroupId: 'model-carbon-umbrella',
    name: '초경량 카본 8본살 방풍 장우산 (테프론 초발수)',
    brand: '어반 기어',
    sellerName: '어반 기어 공식몰',
    category: '패션 · 데일리 잡화',
    price: 49000,
    image: '/src/assets/images/product_cordura_backpack_1795138391703.jpg',
    shortSpec: '295g 초경량 카본 프레임 · 115cm 대형 캐노피 · 자동 원터치',
    description:
      '강풍에도 휘어짐 없이 복원되는 카본 파이버 8본살과 물방울이 바로 털어지는 고밀도 테프론 발수 원단을 적용한 데일리 장우산입니다.',
    attributes: {
      material: '카본 파이버 · 300T 폰지 초발수 원단',
      origin: '대한민국 설계',
      isOverseasDirect: false,
      dimensions: '길이 86cm · 펼침 지름 115cm (295g)',
      sellerRating: 4.8,
      reviewCount: 472,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['295g 초경량 카본', '강풍 역전 복원', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽배송)',
    estimatedArrivalText: '내일 오전 7시 전 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'leather-laptop-sleeve-16',
    modelGroupId: 'model-laptop-sleeve',
    name: '풀그레인 가죽 울트라슬림 노트북 슬리브 (14~16형)',
    brand: '펠레 아틀리에',
    sellerName: '펠레 가죽공방',
    category: '패션 · 데일리 잡화',
    price: 89000,
    image: '/src/assets/images/product_leather_wallet_1795138391269.jpg',
    shortSpec: '천연 소가죽 · 마그네틱 플랩 · 마이크로파이버 안감',
    description:
      '지퍼 스크래치 걱정 없는 마그네틱 히든 클로저와 부드러운 극세사 안감으로 노트북을 안전하게 감싸는 슬림 가죽 슬리브입니다.',
    attributes: {
      material: '이탈리아 풀그레인 소가죽 · 스웨이드 안감',
      origin: '대한민국 핸드메이드',
      isOverseasDirect: false,
      dimensions: '368 × 262 × 16 mm',
      sellerRating: 4.7,
      reviewCount: 234,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['지퍼 없는 마그네틱 덮개', '16인치까지 수납', '무료배송'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (공방 출고)',
    estimatedArrivalText: '2~3일 소요 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'mineral-sunscreen-spf50-official',
    modelGroupId: 'model-mineral-sunscreen',
    name: '논나노 무기자차 데일리 마일드 선크림 SPF50+ (150ml)',
    brand: '보타닉 랩',
    sellerName: '보타닉 랩 공식스토어',
    category: '뷰티 · 퍼스널 케어',
    price: 32000,
    image: '/src/assets/images/product_sunscreen_serum_1795478161471.jpg',
    shortSpec: '백탁 최소화 논나노 징크 · 무향 저자극 · 무료 새벽배송',
    description:
      '민감성 피부와 눈 시림 없이 매일 바를 수 있는 논나노 징크옥사이드 100% 저자극 무기자차 대용량 선크림입니다.',
    attributes: {
      material: '논나노 징크옥사이드 · 판테놀 · 무향 포뮬러',
      origin: '대한민국 제조',
      isOverseasDirect: false,
      dimensions: '150ml 대용량 튜브',
      sellerRating: 4.9,
      reviewCount: 1420,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['피부 저자극 테스트 완료', '눈 시림 없는 무기자차', '무료 새벽배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽배송)',
    estimatedArrivalText: '내일 오전 7시 전 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'mineral-sunscreen-spf50-value',
    modelGroupId: 'model-mineral-sunscreen',
    name: '논나노 무기자차 데일리 마일드 선크림 SPF50+ (150ml)',
    brand: '보타닉 랩',
    sellerName: '뷰티아울렛 최저가샵',
    category: '뷰티 · 퍼스널 케어',
    price: 23500,
    image: '/src/assets/images/product_sunscreen_serum_1795478161471.jpg',
    shortSpec: '단품 할인 특가 · 일반 택배 2~3일 · 최저가',
    description:
      '동일한 보타닉 랩 정품 무기자차 선크림을 별도 사은품 없이 합리적인 단품 최저가로 제공하는 옵션입니다.',
    attributes: {
      material: '논나노 징크옥사이드 · 판테놀 · 무향 포뮬러',
      origin: '대한민국 유통 정품',
      isOverseasDirect: false,
      dimensions: '150ml 대용량 튜브',
      sellerRating: 4.4,
      reviewCount: 389,
      isOfficialSeller: false,
      isFreeShipping: false,
      shippingFee: 3000,
      highlights: ['판매처 최저가', '유통기한 최신 제조분', '대용량 150ml'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (일반 택배)',
    estimatedArrivalText: '2~3일 소요 · 배송비 3,000원',
    stockStatus: '바로 출고',
  },
  {
    id: 'panthenol-barrier-serum',
    modelGroupId: 'model-barrier-serum',
    name: '저분자 히알루론산 · 판테놀 수분 장벽 세럼 (50ml)',
    brand: '루나 스킨랩',
    sellerName: '루나 스킨랩 공식관',
    category: '뷰티 · 퍼스널 케어',
    price: 38000,
    image: '/src/assets/images/product_sunscreen_serum_1795478161471.jpg',
    shortSpec: '판테놀 5% + 8종 히알루론산 · 끈적임 없는 산뜻 흡수',
    description:
      '건조한 실내 환경에서 무너지기 쉬운 피부 수분 장벽을 빠르게 진정시켜 주는 고함량 판테놀 수분 세럼입니다.',
    attributes: {
      material: '판테놀 5% · 8중 히알루론산 · 프로스트 유리 드로퍼',
      origin: '대한민국 제조',
      isOverseasDirect: false,
      dimensions: '50ml 유리 스포이드 병',
      sellerRating: 4.8,
      reviewCount: 712,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['판테놀 5% 고함량', '비건 인증 처방', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'rosemary-scalp-shampoo',
    modelGroupId: 'model-scalp-shampoo',
    name: '약산성 로즈마리 비건 두피 스케일링 샴푸 (500ml)',
    brand: '보타닉 랩',
    sellerName: '보타닉 랩 공식스토어',
    category: '뷰티 · 퍼스널 케어',
    price: 29000,
    image: '/src/assets/images/product_amber_cleanser_1795138391585.jpg',
    shortSpec: '실리콘·설페이트 프리 · pH 5.5 약산성 · 두피 쿨링',
    description:
      '유분과 각질을 자극 없이 정돈하고 로즈마리 잎 오일이 상쾌한 두피 컨디션을 유지해 주는 약산성 비건 샴푸입니다.',
    attributes: {
      material: '코코넛 유래 계면활성제 · 로즈마리 잎 추출물',
      origin: '대한민국 제조',
      isOverseasDirect: false,
      dimensions: '500ml 펌프 보틀',
      sellerRating: 4.7,
      reviewCount: 540,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['실리콘 무첨가', 'pH 5.5 두피 밸런스', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'camping-led-lantern-usbc',
    modelGroupId: 'model-camping-lantern',
    name: '아노다이징 알루미늄 충전식 감성 캠핑 LED 랜턴 (6000mAh)',
    brand: '타이탄 기어',
    sellerName: '타이탄 기어 공식스토어',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 68000,
    image: '/src/assets/images/product_camping_lantern_1795478162314.jpg',
    shortSpec: 'IPX5 생활 방수 · 최대 65시간 점등 · 보조배터리 기능',
    description:
      '무단계 웜 앰버 디밍 조명과 6000mAh 대용량 배터리를 결합해 야외 캠핑은 물론 비상 조명으로도 활용 가능한 아웃도어 랜턴입니다.',
    attributes: {
      material: '아노다이징 알루미늄 바디 · 폴리카보네이트 디퓨저',
      origin: '대한민국 설계',
      isOverseasDirect: false,
      dimensions: '74 × 74 × 178 mm (340g)',
      sellerRating: 4.9,
      reviewCount: 620,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['최대 65시간 연속 점등', 'USB-C 보조배터리 겸용', '무료 새벽배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard', 'direct-quiet'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 1,
    deliveryPeriodLabel: '1일 내 도착 (새벽배송)',
    estimatedArrivalText: '내일 오전 7시 전 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'natural-cork-yoga-mat',
    modelGroupId: 'model-cork-yoga-mat',
    name: '포르투갈 천연 코르크 논슬립 요가 · 필라테스 매트 (6mm)',
    brand: '코어 밸런스',
    sellerName: '코어 밸런스 공식몰',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 74000,
    image: '/src/assets/images/product_camping_lantern_1795478162314.jpg',
    shortSpec: '천연 코르크 + 천연 고무 · 땀에 강한 미끄럼 방지 · 스트랩 포함',
    description:
      '수분이 닿을수록 마찰력이 높아지는 포르투갈산 천연 코르크 상판과 충격 흡수력이 우수한 천연 고무 하판을 결합한 친환경 요가 매트입니다.',
    attributes: {
      material: '100% 포르투갈 천연 코르크 · 천연 고무',
      origin: '포르투갈 원단 / 한국 검수',
      isOverseasDirect: false,
      dimensions: '1830 × 660 × 6 mm',
      sellerRating: 4.8,
      reviewCount: 405,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['땀에도 안 미끄러운 코르크', 'PVC·유해물질 무첨가', '전용 캐리 스트랩 포함'],
    },
    supportedDeliveries: ['next-day', 'scheduled', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'walnut-perpetual-desk-calendar',
    modelGroupId: 'model-desk-calendar',
    name: '월넛 원목 스탠드 레터프레스 데스크 만년 달력',
    brand: '모노 아카이브',
    sellerName: '모노 아카이브 공방',
    category: '문구 · 오피스 · 취미',
    price: 44000,
    image: '/src/assets/images/product_linen_tray_1795136455925.jpg',
    shortSpec: '북미산 월넛 거치대 · 코튼 350g 레터프레스 인쇄 · 만년 사용',
    description:
      '묵직한 북미산 호두나무 원목 블록과 두툼한 코튼 지면의 압인 인쇄 카드가 책상 위 분위기를 정돈해 주는 만년 데스크 캘린더입니다.',
    attributes: {
      material: '북미산 월넛 원목 · 100% 코튼지 350g',
      origin: '대한민국 서울 공방',
      isOverseasDirect: false,
      dimensions: '135 × 45 × 175 mm',
      sellerRating: 4.8,
      reviewCount: 312,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['연도 무관 만년 사용', '레터프레스 활판 인쇄', '무료배송'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'brass-drafting-pencil-set',
    modelGroupId: 'model-brass-pencil',
    name: '아카이브 솔리드 황동 제도용 0.5mm 샤프 · 눈금자 세트',
    brand: '아틀리에 크래프트',
    sellerName: '아틀리에 크래프트 공식관',
    category: '문구 · 오피스 · 취미',
    price: 58000,
    image: '/src/assets/images/product_brass_fountain_pen_1795404523343.jpg',
    shortSpec: '통황동 CNC 절삭 · 4mm 고정 슬리브 · 15cm 황동 자 포함',
    description:
      '낮은 무게 중심으로 흔들림 없는 필기와 드로잉이 가능한 정밀 0.5mm 황동 샤프와 레이저 각인 15cm 스틸/황동 자 세트입니다.',
    attributes: {
      material: '무도금 솔리드 황동 (C3604)',
      origin: '대한민국',
      isOverseasDirect: false,
      dimensions: '샤프 142mm (28g) + 자 155mm',
      sellerRating: 4.9,
      reviewCount: 267,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['저중심 정밀 밸런스', '15cm 황동 자 포함', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'barrel-aged-craft-stout-4pk',
    modelGroupId: 'model-craft-stout',
    name: '오크 배럴 에이지드 임페리얼 스타우트 4캔 컬렉션 (500ml×4)',
    brand: '크래프트 브루어리',
    sellerName: '브루어스 직영 성인몰',
    category: '주류 · 성인 전용 기호품',
    price: 36000,
    image: '/src/assets/images/product_single_malt_whisky_1795138390937.jpg',
    shortSpec: '알코올 9.2% · 버번 배럴 6개월 숙성 · 성인인증 배송',
    description:
      '다크 초콜릿과 에스프레소 풍미가 어우러진 9.2도 수제 배럴 숙성 스타우트 4캔 세트입니다. 만 19세 미만 미성년자는 구매할 수 없습니다.',
    attributes: {
      material: '수제 흑맥주 (9.2% ABV · 500ml × 4캔)',
      origin: '대한민국 강원도 양조',
      isOverseasDirect: false,
      dimensions: '500ml × 4캔 전용 박스',
      sellerRating: 4.8,
      reviewCount: 410,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      isAgeRestricted: true,
      ageRestrictionReason: '청소년보호법상 만 19세 미만 미성년자 판매 금지 품목 (주류)',
      highlights: ['성인(만 19세 이상) 전용', '버번 배럴 6개월 숙성', '무료 성인 확인 배송'],
    },
    supportedDeliveries: ['scheduled', 'next-day'],
    supportedHandoffs: ['direct-quiet'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (성인 확인 배송)',
    estimatedArrivalText: '2~3일 소요 · 무료 성인 확인 배송',
    stockStatus: '성인 인증 필수',
  },
  {
    id: 'jeju-citrus-oak-liqueur',
    modelGroupId: 'model-jeju-liqueur',
    name: '제주 청귤 오크 숙성 프리미엄 리큐르 25% (375ml)',
    brand: '탐라 증류소',
    sellerName: '탐라 증류소 공식 직영',
    category: '주류 · 성인 전용 기호품',
    price: 34000,
    image: '/src/assets/images/product_korean_soju_1795138391217.jpg',
    shortSpec: '알코올 25% · 제주 무농약 청귤 · 오크 캐스크 피니시',
    description:
      '제주산 청귤 증류 원액에 프렌치 오크 숙성 풍미를 더한 25도 아로마틱 리큐르입니다. 만 19세 미만 미성년자는 구매할 수 없습니다.',
    attributes: {
      material: '증류식 리큐르 (25% ABV · 유리 병입)',
      origin: '대한민국 제주특별자치도',
      isOverseasDirect: false,
      dimensions: '375ml 병입',
      sellerRating: 4.7,
      reviewCount: 295,
      isOfficialSeller: true,
      isFreeShipping: false,
      shippingFee: 3000,
      isAgeRestricted: true,
      ageRestrictionReason: '청소년보호법상 만 19세 미만 미성년자 판매 금지 품목 (주류)',
      highlights: ['성인(만 19세 이상) 전용', '제주 청귤 증류 원액', '온더락·하이볼 추천'],
    },
    supportedDeliveries: ['scheduled', 'next-day'],
    supportedHandoffs: ['direct-quiet'],
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    deliveryPeriodLabel: '2~3일 소요 (성인 확인 배송)',
    estimatedArrivalText: '2~3일 소요 · 배송비 3,000원',
    stockStatus: '성인 인증 필수',
  },
  {
    id: 'jirisan-wildflower-honey',
    modelGroupId: 'model-raw-honey',
    name: '지리산 자연숙성 야생화 생벌꿀 (500g)',
    brand: '산청 양봉원',
    sellerName: '산청 양봉원 산지직송',
    category: '식품 · 프리미엄 식음료',
    price: 38000,
    image: '/src/assets/images/product_matcha_olive_set_1795478162594.jpg',
    shortSpec: '비가열 자연숙성 100% · 탄소동위원소비 -24‰ 이하 · 유리병',
    description:
      '지리산 고지대 야생화에서 채밀해 인위적 가열 농축 없이 자연 숙성한 프리미엄 생벌꿀입니다.',
    attributes: {
      material: '100% 천연 벌꿀 (차광 유리병 밀봉)',
      origin: '대한민국 경남 산청 지리산',
      isOverseasDirect: false,
      dimensions: '500g (우드 허니 디퍼 포함)',
      sellerRating: 4.9,
      reviewCount: 445,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['비가열 자연숙성 생꿀', '우드 허니 디퍼 증정', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (산지 직송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'ultralight-titanium-cookset',
    modelGroupId: 'model-titanium-cookset',
    name: '초경량 접이식 티타늄 백패킹 코펠 · 머그 2종 세트',
    brand: '타이탄 기어',
    sellerName: '타이탄 기어 공식스토어',
    category: '스포츠 · 아웃도어 · 캠핑',
    price: 54000,
    image: '/src/assets/images/product_titanium_tumbler_1795404523032.jpg',
    shortSpec: '총 무게 178g 초경량 · 직화 가능 · 메쉬 파우치 포함',
    description:
      '부식에 강하고 직화 가열이 가능한 Grade-1 순수 티타늄 900ml 포트와 400ml 접이식 손잡이 머그가 겹쳐 수납되는 백패킹 쿡웨어 세트입니다.',
    attributes: {
      material: '순수 티타늄 Grade-1 (무코팅 샌드블라스트)',
      origin: '대한민국 설계',
      isOverseasDirect: false,
      dimensions: 'Ø115 × H110 mm (총 178g)',
      sellerRating: 4.8,
      reviewCount: 318,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['178g 초경량 수납', '직화 가열 지원', '무료배송'],
    },
    supportedDeliveries: ['dawn', 'next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
  {
    id: 'fountain-tomoe-notebook',
    modelGroupId: 'model-tomoe-notebook',
    name: '만년필 전용 52g 토모에리버 180도 펼침 양장 노트 (A5)',
    brand: '모노 아카이브',
    sellerName: '모노 아카이브 공방',
    category: '문구 · 오피스 · 취미',
    price: 26000,
    image: '/src/assets/images/product_design_book_1795138391170.jpg',
    shortSpec: '52g/㎡ 중성지 256p · 잉크 비침 최소화 · 사철 실 제본',
    description:
      '만년필 잉크의 번짐과 뒷비침을 억제해 색감과 테를 선명하게 표현하는 초박형 52g 용지와 180도 완전히 펼쳐지는 실 제본 노트입니다.',
    attributes: {
      material: '토모에리버 52g/㎡ · 리넨 하드커버',
      origin: '대한민국 제본',
      isOverseasDirect: false,
      dimensions: 'A5 (148 × 210 mm, 256페이지)',
      sellerRating: 4.9,
      reviewCount: 490,
      isOfficialSeller: true,
      isFreeShipping: true,
      shippingFee: 0,
      highlights: ['만년필 잉크 비침 방지', '180도 완전 펼침 제본', '무료배송'],
    },
    supportedDeliveries: ['next-day', 'bundle', 'eco'],
    supportedHandoffs: ['doorstep-photo', 'locker-guard'],
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    deliveryPeriodLabel: '1~2일 소요 (익일배송)',
    estimatedArrivalText: '1~2일 내 도착 · 무료배송',
    stockStatus: '바로 출고',
  },
];

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function formatShippingFee(shippingFee: number): string {
  return shippingFee <= 0 ? '무료배송' : `배송비 ${formatKrw(shippingFee)}`;
}

export function getSameModelOffers(productId: string): Product[] {
  const target = PRODUCTS.find((p) => p.id === productId);
  if (!target) return [];
  return PRODUCTS.filter((p) => p.modelGroupId === target.modelGroupId);
}

export function getSelectionPriorityLabel(priority: SelectionPriority): string {
  return SELECTION_PRIORITY_OPTIONS.find((opt) => opt.id === priority)?.label ?? priority;
}

export function getDeliveryMeta(id: DeliverySpeed): DeliveryOptionMeta {
  return DELIVERY_SPEED_OPTIONS.find((opt) => opt.id === id) ?? DELIVERY_SPEED_OPTIONS[1];
}

export function getDeliverySpeedLabel(id: DeliverySpeed): string {
  return getDeliveryMeta(id).label;
}

export function getEstimatedArrivalDateString(id: DeliverySpeed, scheduledDate?: string): string {
  const meta = getDeliveryMeta(id);
  if (id === 'scheduled' && scheduledDate) {
    const dt = new Date(scheduledDate);
    if (!Number.isNaN(dt.getTime())) {
      const formatted = dt.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      return `${formatted} (지정 시간대)`;
    }
  }
  const target = new Date();
  target.setDate(target.getDate() + meta.minDays);
  const formatted = target.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  return `${formatted} · ${meta.arrivalWindow}`;
}

export function getHandoffLabel(id: HandoffType): string {
  return HANDOFF_OPTIONS.find((opt) => opt.id === id)?.label ?? id;
}

export function formatOrderDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}:${sec}`;
}

export function getFeedbackLabel(rating: FeedbackRating): string {
  switch (rating) {
    case 'satisfied':
      return '만족';
    case 'dissatisfied':
      return '불만족';
    case 'not-interested':
      return '관심 없음';
  }
}

export function isValidCustomsCode(code: string): boolean {
  return /^P\d{12}$/i.test(code.trim());
}

export function isValidPhone(phone: string): boolean {
  return /^01[016789]-\d{3,4}-\d{4}$/.test(phone.trim());
}

export function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Validates a Korean Resident Registration Number (YYMMDD-GXXXXXX or 13 digits),
 * calculates exact age, age group, and minor status (< 19 years old).
 */
export function parseAndAnalyzeRRN(rrnInput: string): AgeAnalysis | null {
  const digits = normalizeDigits(rrnInput);
  if (digits.length !== 13) return null;

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));

  const century = yy <= 26 ? 2000 : 1900;

  const birthYear = century + yy;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  const birthDate = new Date(birthYear, mm - 1, dd);
  if (
    birthDate.getFullYear() !== birthYear ||
    birthDate.getMonth() !== mm - 1 ||
    birthDate.getDate() !== dd
  ) {
    return null;
  }

  const now = new Date();
  if (birthDate > now) return null;

  let age = now.getFullYear() - birthYear;
  const monthDiff = now.getMonth() - (mm - 1);
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dd)) {
    age -= 1;
  }
  if (age < 0 || age > 130) return null;

  const isMinor = age < 19;
  let ageGroup = '성인';
  if (age < 10) {
    ageGroup = '10세 미만 (미성년자)';
  } else if (age < 20) {
    ageGroup = isMinor ? '10대 (미성년자 · 만 19세 미만)' : '10대 후반 (만 19세 성인)';
  } else if (age < 30) {
    ageGroup = '20대';
  } else if (age < 40) {
    ageGroup = '30대';
  } else if (age < 50) {
    ageGroup = '40대';
  } else if (age < 60) {
    ageGroup = '50대';
  } else {
    ageGroup = '60대 이상';
  }

  const birthDateIso = `${birthYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const maskedRrn = `${digits.slice(0, 6)}-${digits.slice(6, 7)}******`;

  return {
    birthYear,
    birthDateIso,
    age,
    ageGroup,
    isMinor,
    maskedRrn,
  };
}

export interface PreferenceRankParams {
  selectionPriority: SelectionPriority;
  preferredCategories: PreferredProductCategory[];
  preferredDeliverySpeed?: DeliverySpeed;
  feedbacks?: FeedbackRecord[];
  queryTokens?: string[];
}

export interface RankedProduct {
  product: Product;
  fitScore: number;
  rawScore: number;
  queryMatchCount: number;
  fitReason: string;
}

interface NormalizationBounds {
  minCost: number;
  maxCost: number;
  minRating: number;
  maxRating: number;
  minDays: number;
  maxDays: number;
}

function computeProductPreferenceScoreWithBounds(
  product: Product,
  params: PreferenceRankParams,
  bounds?: NormalizationBounds
): RankedProduct {
  const {
    selectionPriority,
    preferredCategories,
    preferredDeliverySpeed,
    feedbacks = [],
    queryTokens = [],
  } = params;

  const totalCost = product.price + product.attributes.shippingFee;
  const minCost = bounds?.minCost ?? 20000;
  const maxCost = bounds && bounds.maxCost > bounds.minCost ? bounds.maxCost : 335000;
  const minRating = bounds?.minRating ?? 4.2;
  const maxRating = bounds && bounds.maxRating > bounds.minRating ? bounds.maxRating : 4.9;
  const minDays = bounds?.minDays ?? 1;
  const maxDays = bounds && bounds.maxDays > bounds.minDays ? bounds.maxDays : 5;

  const avgDays = (product.deliveryDaysMin + product.deliveryDaysMax) / 2;

  // Relative to candidate set (or global fallback): 1 = best in that dimension
  const costNorm = Math.max(0, Math.min(1, (maxCost - totalCost) / Math.max(1, maxCost - minCost)));
  const ratingNorm = Math.max(
    0,
    Math.min(1, (product.attributes.sellerRating - minRating) / Math.max(0.1, maxRating - minRating))
  );
  const reviewNorm = Math.max(0, Math.min(1, product.attributes.reviewCount / 2200));
  const officialNorm = product.attributes.isOfficialSeller ? 1 : 0;
  const speedNorm = Math.max(0, Math.min(1, (maxDays - avgDays) / Math.max(0.5, maxDays - minDays)));

  const reliabilityScore =
    ratingNorm * 0.6 + reviewNorm * 0.18 + officialNorm * 0.14 + speedNorm * 0.08;
  const priceScore = costNorm * 0.88 + (product.attributes.shippingFee === 0 ? 0.12 : 0);

  // Midpoint proximity for 'balanced' priority: favors middle price + middle rating + middle delivery period
  // while penalizing polarized extremes (cheapest/low-star OR most-expensive/top-star).
  const harmony = 1 - Math.abs(costNorm - ratingNorm);
  const centerProximity = 1 - (Math.abs(costNorm - 0.5) + Math.abs(ratingNorm - 0.5)) / 2;
  const balancedScore = harmony * 0.55 + centerProximity * 0.35 + ((costNorm + ratingNorm) / 2) * 0.1;

  let priorityWeightedScore = 0;
  if (selectionPriority === 'price') {
    priorityWeightedScore = priceScore * 60 + reliabilityScore * 6;
  } else if (selectionPriority === 'reliability') {
    priorityWeightedScore = reliabilityScore * 60 + priceScore * 6;
  } else {
    priorityWeightedScore = balancedScore * 60 + speedNorm * 6;
  }

  const categoryBonus = preferredCategories.includes(product.category) ? 12 : 0;
  const deliveryBonus =
    preferredDeliverySpeed && product.supportedDeliveries.includes(preferredDeliverySpeed) ? 4 : 0;

  const fb = feedbacks.find((f) => f.productId === product.id);
  const feedbackDelta = fb
    ? fb.rating === 'satisfied'
      ? 8
      : fb.rating === 'dissatisfied'
      ? -25
      : -45
    : 0;

  let queryMatchCount = 0;
  if (queryTokens.length > 0) {
    const haystack = `${product.name} ${product.brand} ${product.sellerName} ${product.category} ${product.shortSpec} ${product.description} ${product.attributes.origin} ${product.deliveryPeriodLabel}`.toLowerCase();
    queryMatchCount = queryTokens.reduce(
      (acc, token) => (haystack.includes(token) ? acc + 1 : acc),
      0
    );
  }

  const rawScore = 16 + priorityWeightedScore + categoryBonus + deliveryBonus + feedbackDelta;
  const fitScore = Math.max(0, Math.min(99, Math.round(rawScore)));

  const reasons: string[] = [];
  if (categoryBonus > 0) reasons.push('선호 카테고리');
  if (selectionPriority === 'price') {
    reasons.push(
      `최저 총비용 ${formatKrw(totalCost)} (${formatShippingFee(product.attributes.shippingFee)})`
    );
  } else if (selectionPriority === 'reliability') {
    reasons.push(
      `최고 신뢰 별점 ${product.attributes.sellerRating.toFixed(1)} · ${
        product.attributes.isOfficialSeller ? '공식판매처' : product.sellerName
      } · ${product.deliveryPeriodLabel}`
    );
  } else {
    reasons.push(
      `가격·신뢰성 균형 중간값 (${formatKrw(totalCost)} · 별점 ${product.attributes.sellerRating.toFixed(
        1
      )} · ${product.deliveryPeriodLabel})`
    );
  }

  return {
    product,
    fitScore,
    rawScore,
    queryMatchCount,
    fitReason: reasons.join(' · '),
  };
}

export function computeProductPreferenceScore(
  product: Product,
  params: PreferenceRankParams
): RankedProduct {
  return computeProductPreferenceScoreWithBounds(product, params);
}

/**
 * Ranks a list of products so that:
 * - 'price': lowest total cost (price + shippingFee) ranks #1
 * - 'reliability': highest sellerRating + official/review trust + fast delivery ranks #1
 * - 'balanced': the balanced middle-value product (between lowest price and highest reliability) ranks #1
 * Same-product offers sharing a modelGroupId are scored strictly against sibling bounds too!
 */
export function rankProductsByPreference(
  list: Product[],
  params: PreferenceRankParams
): RankedProduct[] {
  if (list.length === 0) return [];

  const costs = list.map((p) => p.price + p.attributes.shippingFee);
  const ratings = list.map((p) => p.attributes.sellerRating);
  const days = list.map((p) => (p.deliveryDaysMin + p.deliveryDaysMax) / 2);

  const globalBounds: NormalizationBounds = {
    minCost: Math.min(...costs),
    maxCost: Math.max(...costs),
    minRating: Math.min(...ratings),
    maxRating: Math.max(...ratings),
    minDays: Math.min(...days),
    maxDays: Math.max(...days),
  };

  // Precompute sibling bounds per modelGroupId so same-product listings compare tightly against each other
  const groupBoundsMap = new Map<string, NormalizationBounds>();
  for (const p of list) {
    const siblings = list.filter((item) => item.modelGroupId === p.modelGroupId);
    if (siblings.length > 1 && !groupBoundsMap.has(p.modelGroupId)) {
      const gCosts = siblings.map((s) => s.price + s.attributes.shippingFee);
      const gRatings = siblings.map((s) => s.attributes.sellerRating);
      const gDays = siblings.map((s) => (s.deliveryDaysMin + s.deliveryDaysMax) / 2);
      groupBoundsMap.set(p.modelGroupId, {
        minCost: Math.min(...gCosts),
        maxCost: Math.max(...gCosts),
        minRating: Math.min(...gRatings),
        maxRating: Math.max(...gRatings),
        minDays: Math.min(...gDays),
        maxDays: Math.max(...gDays),
      });
    }
  }

  return list
    .map((p) =>
      computeProductPreferenceScoreWithBounds(
        p,
        params,
        groupBoundsMap.get(p.modelGroupId) ?? globalBounds
      )
    )
    .sort((a, b) => {
      if (params.queryTokens && params.queryTokens.length > 0) {
        if (b.queryMatchCount !== a.queryMatchCount) {
          return b.queryMatchCount - a.queryMatchCount;
        }
      }
      if (Math.abs(b.rawScore - a.rawScore) > 0.001) {
        return b.rawScore - a.rawScore;
      }
      if (params.selectionPriority === 'price') {
        const costA = a.product.price + a.product.attributes.shippingFee;
        const costB = b.product.price + b.product.attributes.shippingFee;
        if (costA !== costB) return costA - costB;
      }
      if (params.selectionPriority === 'reliability') {
        if (b.product.attributes.sellerRating !== a.product.attributes.sellerRating) {
          return b.product.attributes.sellerRating - a.product.attributes.sellerRating;
        }
        return b.product.attributes.reviewCount - a.product.attributes.reviewCount;
      }
      return b.fitScore - a.fitScore;
    });
}
