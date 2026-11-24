import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {
  DEFAULT_SEARCH_FILTERS,
  PRODUCTS,
  formatShippingFee,
  getDeliveryMeta,
  getDeliverySpeedLabel,
  getEstimatedArrivalDateString,
  getHandoffLabel,
  getSelectionPriorityLabel,
  isValidCustomsCode,
  isValidPhone,
  normalizeDigits,
  parseAndAnalyzeRRN,
  rankProductsByPreference,
} from '../src/shared/catalog.ts';
import type {
  AIRecommendationsResponse,
  AgeAnalysis,
  FeedbackRating,
  FeedbackRecord,
  LearnedProfile,
  NameChangeRequestRecord,
  OrderPreferenceInput,
  OrderRecord,
  ProductReview,
  SearchManualFilters,
  UserOnboardingProfile,
} from '../src/shared/types.ts';
import {
  generatePersonalizedRecommendations,
  learnAndRecommendWithGemini,
  searchProductsWithLearnedProfile,
} from './ai.ts';
import {
  type AppStoreData,
  createEmptyOnboarding,
  createEmptyProfile,
  readStore,
  writeStore,
} from './store.ts';

interface IdentityChallengePayload {
  otpCode: string;
  recipientName: string;
  phoneDigits: string;
  customsClearanceNumber: string;
  maskedRrn: string;
  ageAnalysis: AgeAnalysis;
  expiresAt: number;
}

interface VerifiedIdentityPayload {
  recipientName: string;
  phoneDigits: string;
  customsClearanceNumber: string;
  maskedRrn: string;
  ageAnalysis: AgeAnalysis;
  verifiedAt: string;
  expiresAt: number;
}

interface SessionCookiePayload {
  onboarding: UserOnboardingProfile;
  issuedAt: number;
}

const SESSION_COOKIE_NAME = 'sb_session';

function getSigningSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.GEMINI_API_KEY ||
    'sunbyeol-stateless-hmac-key-2026'
  );
}

function signTokenPayload<T>(payload: T): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyTokenPayload<T>(token: string): T | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as T;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

function readStoreForRequest(req: express.Request): AppStoreData {
  const store = readStore();
  if (store.onboarding.completed) {
    return store;
  }

  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (!sessionToken) return store;

  const parsed = verifyTokenPayload<SessionCookiePayload>(sessionToken);
  if (!parsed?.onboarding?.completed) return store;

  const restoredProfile = buildFallbackLearnedProfile({
    onboarding: parsed.onboarding,
    orders: store.orders,
    feedbacks: store.feedbacks,
  }).profile;

  const restoredRecommendations = buildFallbackRecommendations({
    onboarding: parsed.onboarding,
    profile: restoredProfile,
    feedbacks: store.feedbacks,
  });

  const hydrated: AppStoreData = {
    ...store,
    onboarding: parsed.onboarding,
    profile: restoredProfile,
    recommendations: store.recommendations ?? restoredRecommendations,
  };
  writeStore(hydrated);
  return hydrated;
}

function setSessionCookie(res: express.Response, onboarding: UserOnboardingProfile): void {
  if (!onboarding.completed) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    return;
  }
  const token = signTokenPayload<SessionCookiePayload>({
    onboarding,
    issuedAt: Date.now(),
  });
  const isHttps = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 30}`,
  ];
  if (isHttps) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function maskPhone(phone: string): string {
  const d = normalizeDigits(phone);
  if (d.length === 11) {
    return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  }
  return phone;
}

function hasUsableGeminiKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
}

function buildFallbackLearnedProfile(params: {
  onboarding: UserOnboardingProfile;
  orders: OrderRecord[];
  feedbacks: FeedbackRecord[];
  explicitDirectives?: OrderPreferenceInput;
}): { profile: LearnedProfile; latestInsight: string } {
  const { onboarding, orders, feedbacks, explicitDirectives } = params;
  const preferredCategories =
    explicitDirectives?.preferredCategories && explicitDirectives.preferredCategories.length > 0
      ? explicitDirectives.preferredCategories
      : onboarding.preferredCategories;
  const selectionPriority = explicitDirectives?.selectionPriority ?? onboarding.selectionPriority;
  const speed = explicitDirectives?.deliverySpeed ?? onboarding.defaultDeliverySpeed;
  const handoff = explicitDirectives?.handoffType ?? onboarding.defaultHandoff;
  const speedMeta = getDeliveryMeta(speed);
  const priorityLabel = getSelectionPriorityLabel(selectionPriority);
  const handoffLabel = getHandoffLabel(handoff);

  const latestInsight = explicitDirectives
    ? `${preferredCategories.join(', ')} 선호와 ${speedMeta.label}(${speedMeta.carrier}) · ${handoffLabel} 수령 방식을 학습 프로필에 반영했습니다.`
    : `${onboarding.ageGroup ?? '성인'} 고객의 ${preferredCategories.join(', ')} 선호 및 ${priorityLabel} 기준 초기 설정이 반영되었습니다.`;

  const profile: LearnedProfile = {
    updatedAt: new Date().toISOString(),
    orderCount: orders.length,
    feedbackCount: feedbacks.length,
    preferredCategories,
    selectionPriority,
    selectionPriorityLabel: priorityLabel,
    summary: `${preferredCategories.join(' · ')} 카테고리와 ${priorityLabel} 기준, ${speedMeta.label}을 우선 적용하는 개인화 프로필입니다.`,
    learnedRequirements: [
      {
        label: `${preferredCategories.join(' · ')} 중심 추천`,
        weight: '필수',
        evidence: '초기 설정 및 최근 주문 선호 카테고리',
      },
      {
        label: priorityLabel,
        weight: '높음',
        evidence: '선택한 가격·신뢰성 우선 기준',
      },
    ],
    learnedDelivery: {
      preferredSpeed: speed,
      preferredSpeedLabel: speedMeta.label,
      preferredCarrier: speedMeta.carrier,
      preferredHandoff: handoff,
      preferredHandoffLabel: handoffLabel,
      deliveryRuleSummary: `${speedMeta.label}(${speedMeta.carrier}) · ${handoffLabel}`,
    },
    avoidanceRules: onboarding.isMinor
      ? ['만 19세 미만 미성년자 보호를 위해 주류·성인 전용 제한 물품 제외']
      : [],
    lastInsight: latestInsight,
  };

  return { profile, latestInsight };
}

function buildFallbackRecommendations(params: {
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  feedbacks?: FeedbackRecord[];
}): AIRecommendationsResponse {
  const { onboarding, profile, feedbacks = [] } = params;
  const eligible = PRODUCTS.filter((p) => !(onboarding.isMinor && p.attributes.isAgeRestricted));
  const ranked = rankProductsByPreference(eligible, {
    selectionPriority: profile.selectionPriority,
    preferredCategories: profile.preferredCategories,
    preferredDeliverySpeed: profile.learnedDelivery.preferredSpeed,
    feedbacks,
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: `${profile.preferredCategories.join(' · ')} 선호와 ${profile.selectionPriorityLabel} 기준에 맞춰 최상위 상품을 선별했습니다.`,
    recommendations: ranked.slice(0, 3).map(({ product, fitScore, fitReason }) => {
      const speed = product.supportedDeliveries.includes(profile.learnedDelivery.preferredSpeed)
        ? profile.learnedDelivery.preferredSpeed
        : product.supportedDeliveries[0];
      const handoff = product.supportedHandoffs.includes(profile.learnedDelivery.preferredHandoff)
        ? profile.learnedDelivery.preferredHandoff
        : product.supportedHandoffs[0];
      return {
        productId: product.id,
        overallMatchScore: fitScore,
        requirementMatchScore: fitScore,
        deliveryMatchScore: Math.min(99, fitScore + 2),
        matchHeadline: `${product.category} 맞춤 추천 · 별점 ${product.attributes.sellerRating.toFixed(1)} · ${formatShippingFee(product.attributes.shippingFee)}`,
        requirementFitReason: `${fitReason}. ${profile.selectionPriorityLabel} 기준에 가장 잘 부합합니다.`,
        deliveryFitReason: `${getDeliverySpeedLabel(speed)} 및 ${getHandoffLabel(handoff)} 수령 옵션을 지원합니다.`,
        recommendedDeliverySpeed: speed,
        recommendedHandoff: handoff,
      };
    }),
  };
}

async function runLearningAndRecommendationWithGracefulQuota(params: {
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
  if (hasUsableGeminiKey()) {
    try {
      return await learnAndRecommendWithGemini(params);
    } catch {
      // Fall back gracefully on missing/invalid API key, quota limits, or transient network errors
    }
  }

  const fallback = buildFallbackLearnedProfile({
    onboarding: params.onboarding,
    orders: params.orders,
    feedbacks: params.feedbacks,
    explicitDirectives: params.explicitDirectives,
  });
  const recommendations = buildFallbackRecommendations({
    onboarding: params.onboarding,
    profile: fallback.profile,
    feedbacks: params.feedbacks,
  });
  return {
    profile: fallback.profile,
    latestInsight: fallback.latestInsight,
    recommendations,
  };
}

// Pure Node.js ZIP builder (works across local, Cloud Run, and Vercel Serverless without Python)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function collectExportFiles(rootDir: string): Array<{ relPath: string; fullPath: string }> {
  const excludeDirs = new Set([
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.vercel',
    'data',
    '.aistudio',
    '__pycache__',
  ]);
  const excludeFiles = new Set(['.DS_Store']);
  const results: Array<{ relPath: string; fullPath: string }> = [];

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!excludeDirs.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }
      if (!entry.isFile()) continue;
      if (excludeFiles.has(entry.name) || entry.name.endsWith('.log') || entry.name.endsWith('.zip')) {
        continue;
      }
      if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
        continue;
      }
      const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');
      results.push({ relPath, fullPath });
    }
  };

  walk(rootDir);
  return results;
}

function buildZipBuffer(rootDir: string, prefix = 'sunbyeol'): Buffer {
  const files = collectExportFiles(rootDir);
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file.fullPath);
    const compressed = zlib.deflateRawSync(raw, { level: 6 });
    const crc = crc32(raw);
    const nameBuf = Buffer.from(`${prefix}/${file.relPath}`, 'utf-8');

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localChunks.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(raw.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralChunks.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirSize = centralChunks.reduce((sum, b) => sum + b.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirSize, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, ...centralChunks, endRecord]);
}

export function createApiApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/state', (req, res) => {
    const store = readStoreForRequest(req);
    res.json({
      products: PRODUCTS,
      onboarding: store.onboarding,
      orders: store.orders,
      feedbacks: store.feedbacks,
      reviews: store.reviews,
      nameChangeRequests: store.nameChangeRequests,
      profile: store.profile,
      recommendations: store.recommendations,
    });
  });

  // Step 1 of Phone Cross-Verification: Validate real name, RRN, PCCC, and phone, then issue signed OTP challenge
  app.post('/api/verify/identity/send', (req, res) => {
    const { recipientName, phone, residentRegistrationNumber, customsClearanceNumber } = req.body as {
      recipientName: string;
      phone: string;
      residentRegistrationNumber: string;
      customsClearanceNumber: string;
    };

    if (!recipientName?.trim()) {
      return res.status(400).json({ error: '실제 법적 성명을 입력해 주세요.' });
    }
    if (!isValidPhone(phone ?? '')) {
      return res.status(400).json({
        error: '휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)',
      });
    }
    const ageAnalysis = parseAndAnalyzeRRN(residentRegistrationNumber ?? '');
    if (!ageAnalysis) {
      return res.status(400).json({
        error: '주민등록번호 13자리 형식이 올바르지 않습니다. (예: 950312-1234567)',
      });
    }
    if (!isValidCustomsCode(customsClearanceNumber ?? '')) {
      return res.status(400).json({
        error: '개인통관고유부호 형식이 올바르지 않습니다. (P로 시작하는 13자리, 예: P123456789012)',
      });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const normalizedPccc = customsClearanceNumber.trim().toUpperCase();
    const phoneDigits = normalizeDigits(phone);

    const challengeId = signTokenPayload<IdentityChallengePayload>({
      otpCode,
      recipientName: recipientName.trim(),
      phoneDigits,
      customsClearanceNumber: normalizedPccc,
      maskedRrn: ageAnalysis.maskedRrn,
      ageAnalysis,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return res.json({
      challengeId,
      demoOtpCode: otpCode,
      maskedPhone: maskPhone(phone),
      ageAnalysis,
      message: `${maskPhone(phone)} 번호로 개인통관고유부호·주민등록번호 명의 대조 인증번호를 발송했습니다.`,
    });
  });

  // Step 2 of Phone Cross-Verification: Confirm 6-digit OTP & return stateless signed verification token
  app.post('/api/verify/identity/confirm', (req, res) => {
    const { challengeId, otpCode } = req.body as {
      challengeId: string;
      otpCode: string;
    };

    const challenge = verifyTokenPayload<IdentityChallengePayload>(challengeId);
    if (!challenge) {
      return res.status(400).json({
        error: '인증 요청 내역이 없거나 만료되었습니다. 인증번호를 다시 요청해 주세요.',
      });
    }
    if (Date.now() > challenge.expiresAt) {
      return res.status(400).json({ error: '인증번호 유효시간이 만료되었습니다. 다시 요청해 주세요.' });
    }
    if ((otpCode ?? '').trim() !== challenge.otpCode) {
      return res.status(400).json({ error: '인증번호 6자리가 일치하지 않습니다.' });
    }

    const token = signTokenPayload<VerifiedIdentityPayload>({
      recipientName: challenge.recipientName,
      phoneDigits: challenge.phoneDigits,
      customsClearanceNumber: challenge.customsClearanceNumber,
      maskedRrn: challenge.maskedRrn,
      ageAnalysis: challenge.ageAnalysis,
      verifiedAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    return res.json({
      verified: true,
      identityVerificationToken: token,
      ageAnalysis: challenge.ageAnalysis,
      message: '휴대폰 본인확인 및 주민등록번호·개인통관고유부호 상호 대조 인증이 완료되었습니다.',
    });
  });

  // Initial mandatory onboarding configuration
  app.post('/api/onboarding', async (req, res) => {
    try {
      const store = readStoreForRequest(req);
      if (store.onboarding.completed) {
        return res.status(400).json({
          error: '초기 설정이 이미 완료되었습니다. 주민등록번호와 개인통관고유부호는 변경할 수 없습니다.',
        });
      }

      const payload = req.body as Partial<UserOnboardingProfile> & {
        residentRegistrationNumber?: string;
        identityVerificationToken?: string;
      };

      if (!payload.recipientName?.trim() || !payload.address?.trim() || !payload.phone?.trim()) {
        return res.status(400).json({ error: '실제 성명, 휴대폰 번호, 배송지 주소를 모두 입력해 주세요.' });
      }
      if (!isValidPhone(payload.phone)) {
        return res.status(400).json({
          error: "본인 명의 휴대폰 번호 양식이 올바르지 않습니다. '-'를 포함해 입력해 주세요. (예: 010-1234-5678)",
        });
      }
      if (!isValidCustomsCode(payload.customsClearanceNumber ?? '')) {
        return res.status(400).json({
          error: '개인통관고유부호 형식이 올바르지 않습니다. P로 시작하는 13자리(예: P123456789012)를 입력해 주세요.',
        });
      }
      const ageAnalysis = parseAndAnalyzeRRN(payload.residentRegistrationNumber ?? '');
      if (!ageAnalysis) {
        return res.status(400).json({
          error: '유효한 주민등록번호 13자리를 입력해 주세요.',
        });
      }

      const verifiedRecord = payload.identityVerificationToken
        ? verifyTokenPayload<VerifiedIdentityPayload>(payload.identityVerificationToken)
        : null;

      if (
        !verifiedRecord ||
        Date.now() > verifiedRecord.expiresAt ||
        verifiedRecord.recipientName !== payload.recipientName.trim() ||
        verifiedRecord.phoneDigits !== normalizeDigits(payload.phone) ||
        verifiedRecord.customsClearanceNumber !== payload.customsClearanceNumber!.trim().toUpperCase() ||
        verifiedRecord.maskedRrn !== ageAnalysis.maskedRrn
      ) {
        return res.status(400).json({
          error: '개인통관고유부호와 주민등록번호의 휴대폰 상호 본인확인을 먼저 완료해 주세요.',
        });
      }

      if (!Array.isArray(payload.preferredCategories) || payload.preferredCategories.length === 0) {
        return res.status(400).json({ error: '선호하는 상품 카테고리를 1개 이상 선택해 주세요.' });
      }

      const sanitizedCategories = ageAnalysis.isMinor
        ? payload.preferredCategories.filter((c) => c !== '주류 · 성인 전용 기호품')
        : payload.preferredCategories;

      const onboarding: UserOnboardingProfile = {
        completed: true,
        completedAt: new Date().toISOString(),
        recipientName: payload.recipientName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        customsClearanceNumber: payload.customsClearanceNumber!.trim().toUpperCase(),
        residentRegistrationNumberMasked: ageAnalysis.maskedRrn,
        birthYear: ageAnalysis.birthYear,
        age: ageAnalysis.age,
        ageGroup: ageAnalysis.ageGroup,
        isMinor: ageAnalysis.isMinor,
        identityVerified: true,
        identityVerifiedAt: verifiedRecord.verifiedAt,
        allowOverseasShipping: Boolean(payload.allowOverseasShipping),
        preferredCategories:
          sanitizedCategories.length > 0 ? sanitizedCategories : ['컴퓨터 · 주변기기'],
        selectionPriority: payload.selectionPriority || 'reliability',
        defaultDeliverySpeed: payload.defaultDeliverySpeed || 'dawn',
        defaultHandoff: payload.defaultHandoff || 'doorstep-photo',
      };

      const { profile, recommendations } = await runLearningAndRecommendationWithGracefulQuota({
        onboarding,
        orders: store.orders,
        feedbacks: store.feedbacks,
        currentProfile: store.profile,
      });

      writeStore({
        ...store,
        onboarding,
        profile,
        recommendations,
      });
      setSessionCookie(res, onboarding);

      return res.json({ onboarding, profile, recommendations });
    } catch (err) {
      const message = err instanceof Error ? err.message : '초기 설정 저장 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Formal Name Change Request
  app.post('/api/profile/name-change-request', async (req, res) => {
    try {
      const store = readStoreForRequest(req);
      if (!store.onboarding.completed) {
        return res.status(403).json({ error: '초기 설정이 완료되지 않았습니다.' });
      }

      const { newName, changeDate, reason, declarationConfirmed, phoneConfirm } = req.body as {
        newName: string;
        changeDate: string;
        reason: string;
        declarationConfirmed: boolean;
        phoneConfirm: string;
      };

      if (!newName?.trim()) {
        return res.status(400).json({ error: '개명 후 새로운 법적 성명을 입력해 주세요.' });
      }
      if (newName.trim() === store.onboarding.recipientName.trim()) {
        return res.status(400).json({ error: '기존 등록된 이름과 다른 새 이름을 입력해 주세요.' });
      }
      if (!changeDate?.trim() || !reason?.trim()) {
        return res.status(400).json({ error: '개명 신고/허가 일자와 개명 사유를 모두 입력해 주세요.' });
      }
      if (!declarationConfirmed) {
        return res.status(400).json({ error: '개명 사실 확인 및 동일인 서약에 동의해 주세요.' });
      }
      if (normalizeDigits(phoneConfirm ?? '') !== normalizeDigits(store.onboarding.phone)) {
        return res.status(400).json({
          error: '등록된 휴대폰 번호와 일치하지 않습니다. 본인 확인을 위해 등록된 번호를 정확히 입력해 주세요.',
        });
      }

      const requestRecord: NameChangeRequestRecord = {
        id: `NC-${Date.now()}`,
        previousName: store.onboarding.recipientName,
        newName: newName.trim(),
        changeDate: changeDate.trim(),
        reason: reason.trim(),
        declarationText: `본인(${store.onboarding.recipientName})은 법적 개명 절차를 완료하여 '${newName.trim()}'(으)로 성명이 변경되었음을 공식 통지하며, 기존 주민등록번호(${store.onboarding.residentRegistrationNumberMasked}) 및 개인통관고유부호(${store.onboarding.customsClearanceNumber})와 동일인임을 확인합니다.`,
        status: '개명 신청 승인 완료',
        createdAt: new Date().toISOString(),
      };

      const nextOnboarding: UserOnboardingProfile = {
        ...store.onboarding,
        recipientName: newName.trim(),
      };
      const nextRequests = [requestRecord, ...store.nameChangeRequests];

      writeStore({
        ...store,
        onboarding: nextOnboarding,
        nameChangeRequests: nextRequests,
      });
      setSessionCookie(res, nextOnboarding);

      return res.json({
        onboarding: nextOnboarding,
        profile: store.profile,
        nameChangeRequests: nextRequests,
        requestRecord,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '개명 신청 처리 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Create order
  app.post('/api/orders', async (req, res) => {
    try {
      const { items, recipientName, address, preferences } = req.body as {
        items: Array<{ productId: string; quantity: number }>;
        recipientName: string;
        address: string;
        preferences: OrderPreferenceInput;
      };

      const store = readStoreForRequest(req);
      if (!store.onboarding.completed) {
        return res.status(403).json({ error: '초기 본인확인 및 배송 설정을 먼저 완료해 주세요.' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: '주문할 상품을 1개 이상 선택해 주세요.' });
      }
      if (!recipientName?.trim() || !address?.trim()) {
        return res.status(400).json({ error: '수령인 이름과 배송지 주소를 입력해 주세요.' });
      }

      const resolvedProducts = items.map((item) => {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`존재하지 않는 상품입니다: ${item.productId}`);
        }
        return { product, quantity: Math.max(1, Number(item.quantity) || 1) };
      });

      if (store.onboarding.isMinor) {
        const blocked = resolvedProducts.find((rp) => rp.product.attributes.isAgeRestricted);
        if (blocked) {
          return res.status(403).json({
            error: `만 19세 미만 미성년자(${store.onboarding.ageGroup})는 '${blocked.product.name}' 등 주류·담배 및 성인 전용 제한 물품을 구매할 수 없습니다.`,
          });
        }
      }

      const resolvedItems = resolvedProducts.map(({ product, quantity }) => ({
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        price: product.price,
        quantity,
        image: product.image,
      }));

      const itemsSubtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const baseProductShippingFee =
        resolvedProducts.length > 0
          ? Math.max(...resolvedProducts.map((rp) => rp.product.attributes.shippingFee))
          : 0;
      const deliveryMeta = getDeliveryMeta(preferences.deliverySpeed);
      const optionExtraFee =
        preferences.deliverySpeed === 'dawn' && itemsSubtotal >= 50000 ? 0 : deliveryMeta.extraFee;
      const deliveryFee =
        preferences.deliverySpeed === 'dawn' && itemsSubtotal >= 50000 && baseProductShippingFee === 0
          ? 0
          : Math.max(0, baseProductShippingFee + optionExtraFee);
      const totalAmount = Math.max(0, itemsSubtotal + deliveryFee);
      const estimatedArrivalDate = getEstimatedArrivalDateString(
        preferences.deliverySpeed,
        preferences.scheduledDate
      );

      if (
        deliveryMeta.requiresCustomsCode &&
        !isValidCustomsCode(store.onboarding.customsClearanceNumber)
      ) {
        return res.status(400).json({
          error: '해외 직구 특송을 이용하려면 유효한 개인통관고유부호가 필요합니다.',
        });
      }

      const newOrder: OrderRecord = {
        id: `SB-${new Date().getFullYear()}-${String(1041 + store.orders.length)}`,
        createdAt: new Date().toISOString(),
        items: resolvedItems,
        itemsSubtotal,
        deliveryFee,
        totalAmount,
        deliveryCarrier: deliveryMeta.carrier,
        estimatedArrivalDate,
        customsClearanceNumber: deliveryMeta.requiresCustomsCode
          ? store.onboarding.customsClearanceNumber
          : undefined,
        recipientName: store.onboarding.recipientName,
        address: address.trim(),
        preferences,
        status: '주문 확정 · AI 학습 완료',
        aiLearningNote: '',
      };

      const nextOrders = [newOrder, ...store.orders];
      const nextOnboarding: UserOnboardingProfile = {
        ...store.onboarding,
        preferredCategories:
          preferences.preferredCategories && preferences.preferredCategories.length > 0
            ? preferences.preferredCategories
            : store.onboarding.preferredCategories,
        selectionPriority: preferences.selectionPriority ?? store.onboarding.selectionPriority,
      };

      const { profile, latestInsight, recommendations } =
        await runLearningAndRecommendationWithGracefulQuota({
          onboarding: nextOnboarding,
          orders: nextOrders,
          feedbacks: store.feedbacks,
          currentProfile: store.profile,
          explicitDirectives: preferences,
        });

      newOrder.aiLearningNote = latestInsight;

      writeStore({
        ...store,
        onboarding: nextOnboarding,
        orders: nextOrders,
        profile,
        recommendations,
      });
      setSessionCookie(res, nextOnboarding);

      return res.json({
        order: newOrder,
        orders: nextOrders,
        onboarding: nextOnboarding,
        profile,
        recommendations,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Record feedback
  app.post('/api/feedback', async (req, res) => {
    try {
      const { productId, productName, marketplace, rating, context, query, note } = req.body as {
        productId: string;
        productName?: string;
        marketplace?: string;
        rating: FeedbackRating;
        context: 'search' | 'recommendation' | 'external';
        query?: string;
        note?: string;
      };

      if (!productId) {
        return res.status(400).json({ error: '피드백 대상 상품 정보가 필요합니다.' });
      }
      if (!['satisfied', 'dissatisfied', 'not-interested'].includes(rating)) {
        return res.status(400).json({ error: '올바른 피드백 유형을 선택해 주세요.' });
      }

      const internalProduct = PRODUCTS.find((p) => p.id === productId);
      const resolvedName = internalProduct?.name || productName?.trim();
      if (!resolvedName) {
        return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
      }

      const store = readStoreForRequest(req);
      const newFeedback: FeedbackRecord = {
        id: `FB-${Date.now()}`,
        productId,
        productName: resolvedName,
        marketplace: marketplace || (internalProduct ? 'SUNBYEOL 스토어' : '외부 판매처'),
        rating,
        context,
        query: query?.trim() || undefined,
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const filtered = store.feedbacks.filter((f) => f.productId !== productId);
      const nextFeedbacks = [newFeedback, ...filtered];

      const { profile, recommendations } = await runLearningAndRecommendationWithGracefulQuota({
        onboarding: store.onboarding,
        orders: store.orders,
        feedbacks: nextFeedbacks,
        currentProfile: store.profile,
      });

      writeStore({
        ...store,
        feedbacks: nextFeedbacks,
        profile,
        recommendations,
      });

      return res.json({
        feedback: newFeedback,
        feedbacks: nextFeedbacks,
        profile,
        recommendations,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '피드백 학습 처리 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Submit a product review
  app.post('/api/products/:productId/reviews', (req, res) => {
    try {
      const { productId } = req.params;
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) {
        return res.status(404).json({ error: '평가할 상품을 찾을 수 없습니다.' });
      }

      const { rating, title, content, pros, deliveryRating } = req.body as {
        rating: number;
        title: string;
        content: string;
        pros?: string[];
        deliveryRating?: number;
      };

      const numRating = Math.round(Number(rating));
      if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: '별점은 1점에서 5점 사이로 선택해 주세요.' });
      }
      if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ error: '평가 제목과 상세 후기를 모두 작성해 주세요.' });
      }

      const store = readStoreForRequest(req);
      const authorRaw = store.onboarding.recipientName?.trim() || '구매자';
      const maskedAuthor =
        authorRaw.length >= 2 ? `${authorRaw[0]}*${authorRaw.slice(2)}` : `${authorRaw}*`;
      const hasPurchased = store.orders.some((o) =>
        o.items.some((item) => item.productId === product.id)
      );

      const newReview: ProductReview = {
        id: `REV-${Date.now()}`,
        productId: product.id,
        authorName: maskedAuthor,
        rating: numRating as 1 | 2 | 3 | 4 | 5,
        createdAt: new Date().toISOString(),
        verifiedPurchase: hasPurchased,
        title: title.trim(),
        content: content.trim(),
        pros: Array.isArray(pros) ? pros.filter(Boolean).slice(0, 4) : [],
        deliveryRating: Math.max(1, Math.min(5, Math.round(Number(deliveryRating) || numRating))),
        helpfulCount: 0,
      };

      const nextReviews = [newReview, ...store.reviews];
      writeStore({
        ...store,
        reviews: nextReviews,
      });

      return res.json({
        review: newReview,
        reviews: nextReviews,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '상품 평가 저장 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Refresh personalized AI recommendations
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const store = readStoreForRequest(req);
      if (!store.onboarding.completed) {
        return res.status(403).json({ error: '초기 설정을 먼저 완료해 주세요.' });
      }

      let recommendations: AIRecommendationsResponse;
      if (hasUsableGeminiKey()) {
        try {
          recommendations = await generatePersonalizedRecommendations({
            onboarding: store.onboarding,
            profile: store.profile,
            orders: store.orders,
            feedbacks: store.feedbacks,
          });
        } catch {
          recommendations = buildFallbackRecommendations({
            onboarding: store.onboarding,
            profile: store.profile,
            feedbacks: store.feedbacks,
          });
        }
      } else {
        recommendations = buildFallbackRecommendations({
          onboarding: store.onboarding,
          profile: store.profile,
          feedbacks: store.feedbacks,
        });
      }

      writeStore({
        ...store,
        recommendations,
      });

      return res.json({ recommendations });
    } catch (err) {
      const message = err instanceof Error ? err.message : '개인화 추천 생성 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Update editable settings
  app.post('/api/profile/preferences', async (req, res) => {
    try {
      const { preferences, onboardingPatch } = req.body as {
        preferences: OrderPreferenceInput;
        onboardingPatch?: Partial<UserOnboardingProfile> & { residentRegistrationNumber?: string };
      };

      const store = readStoreForRequest(req);
      if (
        onboardingPatch?.customsClearanceNumber &&
        store.onboarding.completed &&
        onboardingPatch.customsClearanceNumber.trim().toUpperCase() !==
          store.onboarding.customsClearanceNumber.trim().toUpperCase()
      ) {
        return res.status(400).json({
          error: '개인통관고유부호는 최초 등록 후 변경할 수 없습니다.',
        });
      }
      if (onboardingPatch?.residentRegistrationNumber && store.onboarding.completed) {
        return res.status(400).json({
          error: '주민등록번호는 최초 등록 후 변경할 수 없습니다.',
        });
      }
      if (
        onboardingPatch?.recipientName &&
        store.onboarding.completed &&
        onboardingPatch.recipientName.trim() !== store.onboarding.recipientName.trim()
      ) {
        return res.status(400).json({
          error: '실제 성명은 일반 설정에서 직접 변경할 수 없으며, 개명 신청 양식을 통해서만 변경할 수 있습니다.',
        });
      }
      if (
        onboardingPatch?.phone !== undefined &&
        onboardingPatch.phone.trim() &&
        !isValidPhone(onboardingPatch.phone)
      ) {
        return res.status(400).json({
          error: "휴대폰 번호 양식이 올바르지 않습니다. '-'를 포함해 입력해 주세요. (예: 010-1234-5678)",
        });
      }

      const nextCategories =
        preferences.preferredCategories && preferences.preferredCategories.length > 0
          ? preferences.preferredCategories
          : store.onboarding.preferredCategories;

      const nextOnboarding: UserOnboardingProfile = {
        ...store.onboarding,
        recipientName: store.onboarding.recipientName,
        residentRegistrationNumberMasked: store.onboarding.residentRegistrationNumberMasked,
        customsClearanceNumber: store.onboarding.customsClearanceNumber,
        phone: onboardingPatch?.phone?.trim() || store.onboarding.phone,
        address: onboardingPatch?.address?.trim() || store.onboarding.address,
        allowOverseasShipping:
          onboardingPatch?.allowOverseasShipping !== undefined
            ? Boolean(onboardingPatch.allowOverseasShipping)
            : store.onboarding.allowOverseasShipping,
        preferredCategories: nextCategories,
        selectionPriority: preferences.selectionPriority ?? store.onboarding.selectionPriority,
        defaultDeliverySpeed: preferences.deliverySpeed,
        defaultHandoff: preferences.handoffType,
      };

      const { profile, recommendations } = await runLearningAndRecommendationWithGracefulQuota({
        onboarding: nextOnboarding,
        orders: store.orders,
        feedbacks: store.feedbacks,
        currentProfile: store.profile,
        explicitDirectives: preferences,
      });

      writeStore({
        ...store,
        onboarding: nextOnboarding,
        profile,
        recommendations,
      });
      setSessionCookie(res, nextOnboarding);

      return res.json({ onboarding: nextOnboarding, profile, recommendations });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 학습 프로필 업데이트 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/profile/reset-learning', async (req, res) => {
    try {
      const store = readStoreForRequest(req);
      const emptyProf = createEmptyProfile();
      const { profile, recommendations } = await runLearningAndRecommendationWithGracefulQuota({
        onboarding: store.onboarding,
        orders: [],
        feedbacks: [],
        currentProfile: emptyProf,
      });
      writeStore({
        ...store,
        orders: [],
        feedbacks: [],
        profile,
        recommendations,
      });
      return res.json({ orders: [], feedbacks: [], profile, recommendations });
    } catch (err) {
      const message = err instanceof Error ? err.message : '학습 기록 초기화 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/profile/reset', (_req, res) => {
    const empty = {
      onboarding: createEmptyOnboarding(),
      orders: [],
      feedbacks: [],
      reviews: [],
      nameChangeRequests: [],
      profile: createEmptyProfile(),
      recommendations: null,
    };
    writeStore(empty);
    setSessionCookie(res, empty.onboarding);
    res.json(empty);
  });

  app.post('/api/profile/seed', async (req, res) => {
    try {
      const store = readStoreForRequest(req);
      const sampleOrders: OrderRecord[] = [
        {
          id: 'SB-2026-1039',
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          items: [
            {
              productId: 'keychron-silent-mech',
              productName: '로우노이즈 무선 기계식 키보드 & 마우스 세트',
              brand: '모노 타이핑',
              price: 168000,
              quantity: 1,
              image: '/src/assets/images/product_mech_keyboard_1795138391185.jpg',
            },
          ],
          itemsSubtotal: 168000,
          deliveryFee: 0,
          totalAmount: 168000,
          deliveryCarrier: '컬리넥스트마일 새벽물류',
          estimatedArrivalDate: '배송 완료',
          recipientName: store.onboarding.recipientName || '김서연',
          address: store.onboarding.address || '서울시 성동구 서울숲2길 32-14, 402호',
          preferences: {
            preferredCategories: store.onboarding.preferredCategories,
            selectionPriority: store.onboarding.selectionPriority,
            deliverySpeed: 'dawn',
            handoffType: 'doorstep-photo',
            deliveryNote: '오전 7시 출근 전 문 앞 비대면 + 사진 안내 부탁드립니다.',
          },
          status: '주문 확정 · AI 학습 완료',
          aiLearningNote: '컴퓨터 · 주변기기 선호, 새벽배송 비대면 수령 패턴을 학습했습니다.',
        },
        {
          id: 'SB-2026-1040',
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          items: [
            {
              productId: 'oak-steel-quiet-kettle',
              productName: '브러쉬드 스틸 저소음 드립 전기 주전자',
              brand: '오크 앤 스틸',
              price: 165000,
              quantity: 1,
              image: '/src/assets/images/product_steel_kettle_1795136456275.jpg',
            },
          ],
          itemsSubtotal: 165000,
          deliveryFee: 0,
          totalAmount: 165000,
          deliveryCarrier: '로지스그린 EV 친환경 물류',
          estimatedArrivalDate: '배송 완료',
          recipientName: store.onboarding.recipientName || '김서연',
          address: store.onboarding.address || '서울시 성동구 서울숲2길 32-14, 402호',
          preferences: {
            preferredCategories: store.onboarding.preferredCategories,
            selectionPriority: store.onboarding.selectionPriority,
            deliverySpeed: 'eco',
            handoffType: 'doorstep-photo',
            deliveryNote: '비대면 문 앞 배송 부탁드립니다.',
          },
          status: '주문 확정 · AI 학습 완료',
          aiLearningNote: '생활 · 주방가전 및 공식 판매처 신뢰성 우선 기준을 강화 학습했습니다.',
        },
      ];

      const sampleFeedbacks: FeedbackRecord[] = [
        {
          id: 'FB-SAMPLE-1',
          productId: 'sono-studio-speaker',
          productName: '소노 스튜디오 미니멀 블루투스 스피커',
          marketplace: 'SUNBYEOL 스토어',
          rating: 'not-interested',
          context: 'recommendation',
          note: '관심 없음 선택',
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
      ];

      const { profile, recommendations } = await runLearningAndRecommendationWithGracefulQuota({
        onboarding: store.onboarding,
        orders: sampleOrders,
        feedbacks: sampleFeedbacks,
        currentProfile: store.profile,
      });

      writeStore({
        ...store,
        orders: sampleOrders,
        feedbacks: sampleFeedbacks,
        profile,
        recommendations,
      });

      return res.json({
        orders: sampleOrders,
        feedbacks: sampleFeedbacks,
        profile,
        recommendations,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '예시 학습 데이터 생성 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // AI Search with Manual Filters
  app.post('/api/ai/search', async (req, res) => {
    try {
      const { query, useProfile, filters, allowBrowseAll } = req.body as {
        query?: string;
        useProfile?: boolean;
        filters?: SearchManualFilters;
        allowBrowseAll?: boolean;
      };

      const store = readStoreForRequest(req);
      if (!store.onboarding.completed) {
        return res.status(403).json({ error: '초기 본인확인 및 배송 설정을 먼저 완료해 주세요.' });
      }

      const rawMinPrice = filters?.minPrice;
      const rawMaxPrice = filters?.maxPrice;
      const normalizedMinPrice =
        typeof rawMinPrice === 'number' && Number.isFinite(rawMinPrice) && rawMinPrice >= 0
          ? rawMinPrice
          : undefined;
      const normalizedMaxPrice =
        typeof rawMaxPrice === 'number' && Number.isFinite(rawMaxPrice) && rawMaxPrice >= 0
          ? rawMaxPrice
          : undefined;

      if (
        normalizedMinPrice !== undefined &&
        normalizedMaxPrice !== undefined &&
        normalizedMinPrice > normalizedMaxPrice
      ) {
        return res.status(400).json({
          error: '최소 가격은 최대 가격보다 작거나 같아야 합니다.',
        });
      }

      const appliedFilters: SearchManualFilters = {
        ...DEFAULT_SEARCH_FILTERS,
        ...(filters ?? {}),
        minPrice: normalizedMinPrice,
        maxPrice: normalizedMaxPrice,
        minRating:
          typeof filters?.minRating === 'number' && Number.isFinite(filters.minRating)
            ? filters.minRating
            : 0,
      };
      const hasActiveFilter =
        appliedFilters.category !== '전체' ||
        appliedFilters.freeShippingOnly ||
        appliedFilters.minPrice !== undefined ||
        appliedFilters.maxPrice !== undefined ||
        appliedFilters.minRating > 0 ||
        appliedFilters.deliverySpeed !== 'all' ||
        appliedFilters.sortBy !== 'ai-match';

      if ((!query || !query.trim()) && !hasActiveFilter && !allowBrowseAll && !filters) {
        return res.status(400).json({ error: '검색어 또는 수동 필터를 하나 이상 입력해 주세요.' });
      }

      const result = await searchProductsWithLearnedProfile({
        query: (query ?? '').trim(),
        onboarding: store.onboarding,
        profile: store.profile,
        feedbacks: store.feedbacks,
        useProfile: useProfile !== false,
        filters: appliedFilters,
      });

      return res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 검색 처리 중 오류가 발생했습니다.';
      return res.status(500).json({ error: message });
    }
  });

  // Clean GitHub-ready ZIP export (pure Node.js, works on local, Cloud Run, and Vercel)
  app.get('/api/export/github-zip', (_req, res) => {
    try {
      const projectRoot = path.resolve(process.cwd());
      const zipBuffer = buildZipBuffer(projectRoot, 'sunbyeol');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="sunbyeol-github.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      return res.send(zipBuffer);
    } catch {
      return res.status(500).json({ error: 'GitHub용 ZIP 파일 생성 중 오류가 발생했습니다.' });
    }
  });

  // Always return JSON 404 for unmatched /api/* routes instead of HTML fallback
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: '요청한 API 경로를 찾을 수 없습니다.' });
  });

  return app;
}
