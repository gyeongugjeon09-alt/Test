import fs from 'fs';
import path from 'path';
import { getSelectionPriorityLabel } from '../src/shared/catalog.ts';
import type {
  AIRecommendationsResponse,
  FeedbackRecord,
  LearnedProfile,
  NameChangeRequestRecord,
  OrderRecord,
  ProductReview,
  UserOnboardingProfile,
} from '../src/shared/types.ts';

export interface AppStoreData {
  onboarding: UserOnboardingProfile;
  orders: OrderRecord[];
  feedbacks: FeedbackRecord[];
  reviews: ProductReview[];
  nameChangeRequests: NameChangeRequestRecord[];
  profile: LearnedProfile;
  recommendations: AIRecommendationsResponse | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export function createEmptyOnboarding(): UserOnboardingProfile {
  return {
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
}

export function createEmptyProfile(): LearnedProfile {
  return {
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
    lastInsight: '본인 확인 및 초기 설정을 완료하면 맞춤형 AI 추천 및 상품 검색이 활성화됩니다.',
  };
}

export function readStore(): AppStoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initial: AppStoreData = {
        onboarding: createEmptyOnboarding(),
        orders: [],
        feedbacks: [],
        reviews: [],
        nameChangeRequests: [],
        profile: createEmptyProfile(),
        recommendations: null,
      };
      writeStore(initial);
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppStoreData>;
    const emptyOnboarding = createEmptyOnboarding();
    const emptyProfile = createEmptyProfile();

    const onboarding: UserOnboardingProfile = parsed.onboarding
      ? {
          ...emptyOnboarding,
          ...parsed.onboarding,
          preferredCategories:
            Array.isArray(parsed.onboarding.preferredCategories) &&
            parsed.onboarding.preferredCategories.length > 0
              ? parsed.onboarding.preferredCategories
              : emptyOnboarding.preferredCategories,
          selectionPriority:
            parsed.onboarding.selectionPriority ?? emptyOnboarding.selectionPriority,
          isMinor: Boolean(parsed.onboarding.isMinor),
          identityVerified: Boolean(parsed.onboarding.identityVerified),
        }
      : emptyOnboarding;

    const profile: LearnedProfile = parsed.profile
      ? {
          ...emptyProfile,
          ...parsed.profile,
          preferredCategories:
            Array.isArray(parsed.profile.preferredCategories) &&
            parsed.profile.preferredCategories.length > 0
              ? parsed.profile.preferredCategories
              : onboarding.preferredCategories,
          selectionPriority: parsed.profile.selectionPriority ?? onboarding.selectionPriority,
          selectionPriorityLabel:
            parsed.profile.selectionPriorityLabel ??
            getSelectionPriorityLabel(
              parsed.profile.selectionPriority ?? onboarding.selectionPriority
            ),
          feedbackCount: parsed.profile.feedbackCount ?? (parsed.feedbacks?.length ?? 0),
          learnedDelivery: {
            ...emptyProfile.learnedDelivery,
            ...(parsed.profile.learnedDelivery ?? {}),
          },
        }
      : emptyProfile;

    return {
      onboarding,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      nameChangeRequests: Array.isArray(parsed.nameChangeRequests) ? parsed.nameChangeRequests : [],
      profile,
      recommendations: parsed.recommendations ?? null,
    };
  } catch {
    return {
      onboarding: createEmptyOnboarding(),
      orders: [],
      feedbacks: [],
      reviews: [],
      nameChangeRequests: [],
      profile: createEmptyProfile(),
      recommendations: null,
    };
  }
}

export function writeStore(data: AppStoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
