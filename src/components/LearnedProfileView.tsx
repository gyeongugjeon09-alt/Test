import { useState } from 'react';
import {
  AlertCircle,
  FileSignature,
  Loader2,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { HANDOFF_OPTIONS, getFeedbackLabel, isValidPhone } from '../shared/catalog.ts';
import { parseJsonResponse } from '../shared/http.ts';
import type {
  AIRecommendationsResponse,
  DeliverySpeed,
  FeedbackRecord,
  HandoffType,
  LearnedProfile,
  NameChangeRequestRecord,
  OrderRecord,
  PreferredProductCategory,
  SelectionPriority,
  UserOnboardingProfile,
} from '../shared/types.ts';
import { DeliveryOptionSelector } from './DeliveryOptionSelector.tsx';
import { NameChangeModal } from './NameChangeModal.tsx';
import { RequirementCriteriaSelector } from './RequirementCriteriaSelector.tsx';

interface LearnedProfileViewProps {
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  feedbacks: FeedbackRecord[];
  nameChangeRequests: NameChangeRequestRecord[];
  onProfileUpdated: (payload: {
    onboarding?: UserOnboardingProfile;
    profile: LearnedProfile;
    orders?: OrderRecord[];
    feedbacks?: FeedbackRecord[];
    nameChangeRequests?: NameChangeRequestRecord[];
    recommendations?: AIRecommendationsResponse | null;
  }) => void;
  onGoToSearch: () => void;
}

export function LearnedProfileView({
  onboarding,
  profile,
  feedbacks,
  nameChangeRequests,
  onProfileUpdated,
  onGoToSearch,
}: LearnedProfileViewProps) {
  const [phone, setPhone] = useState(onboarding.phone);
  const [address, setAddress] = useState(onboarding.address);
  const [allowOverseas, setAllowOverseas] = useState(onboarding.allowOverseasShipping);

  const [preferredCategories, setPreferredCategories] = useState<PreferredProductCategory[]>(
    profile.preferredCategories.length > 0
      ? profile.preferredCategories
      : onboarding.preferredCategories
  );
  const [selectionPriority, setSelectionPriority] = useState<SelectionPriority>(
    profile.selectionPriority || onboarding.selectionPriority
  );

  const [speed, setSpeed] = useState<DeliverySpeed>(profile.learnedDelivery.preferredSpeed);
  const [handoff, setHandoff] = useState<HandoffType>(profile.learnedDelivery.preferredHandoff);
  const [deliveryNote, setDeliveryNote] = useState(profile.learnedDelivery.deliveryRuleSummary);

  const [isNameChangeOpen, setIsNameChangeOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleManualLearn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (!isValidPhone(phone)) {
      setErrorMsg('연락처가 양식과 맞지 않습니다. 다시 작성해주십시오.');
      return;
    }
    setIsUpdating(true);

    try {
      const res = await fetch('/api/profile/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            preferredCategories,
            selectionPriority,
            deliverySpeed: speed,
            handoffType: handoff,
            deliveryNote,
          },
          onboardingPatch: {
            phone: phone.trim(),
            address: address.trim(),
            allowOverseasShipping: allowOverseas,
          },
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || '프로필 학습에 실패했습니다.');
      onProfileUpdated({
        onboarding: data.onboarding as UserOnboardingProfile,
        profile: data.profile as LearnedProfile,
        recommendations: data.recommendations as AIRecommendationsResponse,
      });
      setStatusMsg(
        '변경 가능한 설정(연락처·주소·카테고리·선택 기준·배송 방식)을 저장하고 AI를 재학습했습니다.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSeedSample = async () => {
    setIsSeeding(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/profile/seed', { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || '예시 주문 생성에 실패했습니다.');
      const nextProfile = data.profile as LearnedProfile;
      onProfileUpdated({
        profile: nextProfile,
        orders: data.orders as OrderRecord[],
        feedbacks: data.feedbacks as FeedbackRecord[],
        recommendations: data.recommendations as AIRecommendationsResponse,
      });
      setSpeed(nextProfile.learnedDelivery.preferredSpeed);
      setHandoff(nextProfile.learnedDelivery.preferredHandoff);
      setDeliveryNote(nextProfile.learnedDelivery.deliveryRuleSummary);
      setStatusMsg('예시 주문 2건과 피드백 데이터를 반영하여 AI 학습을 완료했습니다.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '예시 학습 데이터 생성에 실패했습니다.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetLearningOnly = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/profile/reset-learning', { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || '학습 기록 초기화에 실패했습니다.');
      onProfileUpdated({
        profile: data.profile as LearnedProfile,
        orders: data.orders as OrderRecord[],
        feedbacks: data.feedbacks as FeedbackRecord[],
        recommendations: data.recommendations as AIRecommendationsResponse,
      });
      setStatusMsg('등록된 본인인증·통관부호·주민번호는 유지하고 주문·피드백 학습 이력을 초기화했습니다.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '학습 기록 초기화에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E4E4E7]">
        <div>
          <p className="text-xs font-medium text-[#71717A]">
            누적 주문 <span className="font-mono tabular-nums">{profile.orderCount}</span>건
            <span aria-hidden="true"> · </span>
            피드백 학습 <span className="font-mono tabular-nums">{feedbacks.length}</span>건
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#18181B] tracking-tight mt-1">
            설정 · 내 본인정보 · AI 학습 프로필
          </h1>
          <p className="text-sm text-[#52525B] mt-2 max-w-2xl leading-relaxed">
            주민등록번호와 개인통관고유부호는 변경할 수 없으며, 실제 이름은 개명 신청 요청 양식을 통해서만 변경할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSeedSample}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>예시 학습 체험</span>
          </button>
          <button
            type="button"
            onClick={handleResetLearningOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>학습 이력 초기화</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-3 text-sm text-[#B91C1C]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && (
        <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-sm text-[#1E40AF]">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Learned AI Summary, Feedback History, Name Change Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Age Group & Verification Card */}
          <section className="p-5 bg-white border border-[#E4E4E7] rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#18181B]">연령대 및 구매 권한 분석</h2>
              {onboarding.isMinor ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  미성년자 제한 적용
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  성인 인증 완료
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#18181B]">
              {onboarding.ageGroup ?? '성인'} (만 {onboarding.age ?? 25}세 · {onboarding.birthYear ?? 1995}년생)
            </p>
            <p className="text-xs text-[#52525B] leading-relaxed">
              {onboarding.isMinor
                ? '등록된 주민등록번호 기준 만 19세 미만이므로 주류·담배 등 성인 전용 제한 물품은 장바구니 담기, 주문, AI 추천에서 모두 차단됩니다.'
                : '성인 연령으로 확인되어 주류·성인 전용 카테고리를 포함한 모든 상품을 구매하실 수 있습니다.'}
            </p>
          </section>

          <section className="p-5 bg-white border border-[#E4E4E7] rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#18181B]">AI 종합 학습 요약</h2>
              <button
                type="button"
                onClick={onGoToSearch}
                className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                AI 검색 이동
              </button>
            </div>
            <div className="text-xs text-[#52525B]">
              <span className="font-semibold text-[#18181B]">선호 카테고리: </span>
              {profile.preferredCategories.join(' · ')}
            </div>
            <div className="text-xs text-[#1D4ED8] font-semibold">
              우선 평가 기준: {profile.selectionPriorityLabel}
            </div>
            <p className="text-sm text-[#18181B] leading-relaxed pt-2 border-t border-[#E4E4E7]">
              {profile.summary}
            </p>
            <p className="text-xs text-[#71717A]">최근 학습 인사이트: {profile.lastInsight}</p>
          </section>

          <section className="p-5 bg-white border border-[#E4E4E7] rounded-xl space-y-2">
            <h3 className="text-xs font-semibold text-[#71717A]">선호 배송 · 제공 업체</h3>
            <p className="text-sm font-semibold text-[#18181B]">
              {profile.learnedDelivery.preferredSpeedLabel}
            </p>
            <p className="text-xs text-[#1D4ED8] font-medium">
              {profile.learnedDelivery.preferredCarrier}
            </p>
            <p className="text-xs text-[#52525B]">
              수령: {profile.learnedDelivery.preferredHandoffLabel}
            </p>
          </section>

          {/* Name Change Request History */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#18181B]">
              개명 신청(실명 변경 요청) 이력 ({nameChangeRequests.length})
            </h2>
            {nameChangeRequests.length === 0 ? (
              <div className="p-4 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#71717A]">
                아직 제출된 개명 신청 내역이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-[#E4E4E7] bg-white border border-[#E4E4E7] rounded-xl">
                {nameChangeRequests.map((req) => (
                  <div key={req.id} className="p-4 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#18181B]">
                        {req.previousName} → {req.newName}
                      </span>
                      <span className="text-[#15803D] font-medium">{req.status}</span>
                    </div>
                    <p className="text-[#52525B]">사유: {req.reason} (신고일 {req.changeDate})</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Feedback History */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#18181B]">
              남긴 추천 · 검색 피드백 ({feedbacks.length})
            </h2>
            {feedbacks.length === 0 ? (
              <div className="p-4 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#71717A]">
                아직 남긴 피드백이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-[#E4E4E7] bg-white border border-[#E4E4E7] rounded-xl">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#18181B] truncate">
                        {fb.productName}
                        {fb.marketplace && (
                          <span className="font-normal text-[#71717A]"> · {fb.marketplace}</span>
                        )}
                      </p>
                      <p className="text-[#71717A] mt-0.5">
                        {fb.context === 'search' || fb.context === 'external'
                          ? `검색: ${fb.query ?? ''}`
                          : '개인화 추천'}
                      </p>
                    </div>
                    <span
                      className={`font-semibold whitespace-nowrap shrink-0 ${
                        fb.rating === 'satisfied'
                          ? 'text-[#1D4ED8]'
                          : fb.rating === 'dissatisfied'
                          ? 'text-[#B91C1C]'
                          : 'text-[#52525B]'
                      }`}
                    >
                      {getFeedbackLabel(fb.rating)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Personal Info (RRN & PCCC Locked, Real Name via Formal Request) + Category/Priority + Delivery */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleManualLearn}
            className="p-6 bg-white border border-[#E4E4E7] rounded-xl space-y-7"
          >
            <div>
              <h2 className="text-base font-semibold text-[#18181B]">
                개인정보 · 카테고리 · 평가 기준 · 배송 설정
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                주민등록번호와 개인통관고유부호는 변경할 수 없으며, 실제 이름은 아래 &apos;개명 신청&apos; 버튼을 통해서만 변경할 수 있습니다.
              </p>
            </div>

            <div className="space-y-4 pb-6 border-b border-[#E4E4E7]">
              <h3 className="text-xs font-semibold text-[#18181B]">본인인증 및 통관 정보</h3>

              {/* Immutable RRN */}
              <div className="p-3.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
                  <span className="font-medium text-[#52525B]">주민등록번호 (변경 불가)</span>
                </div>
                <span className="font-mono text-sm font-semibold text-[#18181B] tracking-wider">
                  {onboarding.residentRegistrationNumberMasked} · {onboarding.ageGroup}
                </span>
              </div>

              {/* Immutable PCCC */}
              <div className="p-3.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
                  <span className="font-medium text-[#52525B]">개인통관고유부호 (변경 불가)</span>
                </div>
                <span className="font-mono text-sm font-semibold text-[#18181B] tracking-wider">
                  {onboarding.customsClearanceNumber}
                </span>
              </div>

              {/* Real Legal Name (Only changeable via Name Change Request) */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#52525B]">
                    실제 법적 성명 (직접 수정 불가 · 개명 신청을 통해서만 변경)
                  </p>
                  <p className="text-sm font-semibold text-[#18181B] mt-0.5">
                    {onboarding.recipientName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNameChangeOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>개명 신청 (이름 변경 요청)</span>
                </button>
              </div>

              {/* Editable Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-phone" className="block text-xs font-medium text-[#52525B] mb-1">
                    연락처 (변경 가능)
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예: 010-9999-9999"
                    className={`w-full px-3 py-2 text-sm font-mono bg-white border rounded-lg ${
                      phone.trim().length > 0 && !isValidPhone(phone)
                        ? 'border-[#DC2626]'
                        : 'border-[#D4D4D8]'
                    }`}
                  />
                  {phone.trim().length > 0 && !isValidPhone(phone) && (
                    <p className="text-[11px] font-medium text-[#DC2626] mt-1">
                      양식과 맞지 않습니다 다시 작성해주십시오
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-addr" className="block text-xs font-medium text-[#52525B] mb-1">
                    배송지 주소 (변경 가능)
                  </label>
                  <input
                    id="edit-addr"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="예: 서울특별시 강남구 테헤란로 152, 402호"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-lg"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#52525B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverseas}
                  onChange={(e) => setAllowOverseas(e.target.checked)}
                  className="w-4 h-4 accent-[#1D4ED8]"
                />
                <span>해외 직구 특송 상품 추천 및 검색 포함</span>
              </label>
            </div>

            {/* 2-Step Category + Price/Reliability Selector (NO granular reqs or packaging) */}
            <div className="pb-6 border-b border-[#E4E4E7]">
              <RequirementCriteriaSelector
                selectedCategories={preferredCategories}
                onChangeCategories={setPreferredCategories}
                selectionPriority={selectionPriority}
                onChangeSelectionPriority={setSelectionPriority}
                isMinor={onboarding.isMinor}
              />
            </div>

            {/* Delivery Options (NO packaging dropdown) */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#18181B]">
                선호 배송 방식 (제공 업체 · 도착일 · 비용)
              </p>
              <DeliveryOptionSelector
                selectedSpeed={speed}
                onSelectSpeed={setSpeed}
                customsClearanceNumber={onboarding.customsClearanceNumber}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label htmlFor="profile-handoff" className="block text-xs font-medium text-[#52525B] mb-1">
                    선호 수령 방식
                  </label>
                  <select
                    id="profile-handoff"
                    value={handoff}
                    onChange={(e) => setHandoff(e.target.value as HandoffType)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E4E4E7] rounded-lg"
                  >
                    {HANDOFF_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-note" className="block text-xs font-medium text-[#52525B] mb-1">
                    고정 배송 메모
                  </label>
                  <input
                    id="profile-note"
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="예: 문 앞에 두고 사진 알림 부탁드립니다."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E4E4E7] rounded-lg"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-3 px-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isUpdating ? '변경사항 저장 및 AI 재학습 중...' : '변경사항 저장 및 AI 재학습하기'}</span>
            </button>
          </form>
        </div>
      </div>

      <NameChangeModal
        isOpen={isNameChangeOpen}
        onClose={() => setIsNameChangeOpen(false)}
        onboarding={onboarding}
        onCompleted={(payload) => {
          onProfileUpdated({
            onboarding: payload.onboarding,
            profile: payload.profile,
            nameChangeRequests: payload.nameChangeRequests,
          });
          setStatusMsg(
            `개명 신청이 승인되어 실제 성명이 '${payload.requestRecord.previousName}'에서 '${payload.requestRecord.newName}'(으)로 변경되었습니다.`
          );
        }}
      />
    </div>
  );
}
