import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  HANDOFF_OPTIONS,
  isValidCustomsCode,
  isValidPhone,
  parseAndAnalyzeRRN,
} from '../shared/catalog.ts';
import { parseJsonResponse } from '../shared/http.ts';
import type {
  AIRecommendationsResponse,
  DeliverySpeed,
  HandoffType,
  LearnedProfile,
  PreferredProductCategory,
  SelectionPriority,
  UserOnboardingProfile,
} from '../shared/types.ts';
import { DeliveryOptionSelector } from './DeliveryOptionSelector.tsx';
import { RequirementCriteriaSelector } from './RequirementCriteriaSelector.tsx';

interface OnboardingGateProps {
  initialData: UserOnboardingProfile;
  onCompleted: (payload: {
    onboarding: UserOnboardingProfile;
    profile: LearnedProfile;
    recommendations: AIRecommendationsResponse;
  }) => void;
}

export function OnboardingGate({ initialData, onCompleted }: OnboardingGateProps) {
  const [recipientName, setRecipientName] = useState(initialData.recipientName || '');
  const [rrnFront, setRrnFront] = useState('');
  const [rrnBack, setRrnBack] = useState('');
  const rrnBackRef = useRef<HTMLInputElement | null>(null);
  const rrnInput = `${rrnFront}-${rrnBack}`;
  const [customsClearanceNumber, setCustomsClearanceNumber] = useState(
    initialData.customsClearanceNumber || ''
  );
  const [phone, setPhone] = useState(initialData.phone || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [allowOverseasShipping, setAllowOverseasShipping] = useState(
    initialData.allowOverseasShipping
  );

  // Phone Cross-Verification State (RRN <-> PCCC <-> Phone <-> Real Name)
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [demoOtpBanner, setDemoOtpBanner] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [identityToken, setIdentityToken] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);

  const [preferredCategories, setPreferredCategories] = useState<PreferredProductCategory[]>(
    initialData.preferredCategories.length > 0
      ? initialData.preferredCategories
      : ['컴퓨터 · 주변기기', '생활 · 주방가전']
  );
  const [selectionPriority, setSelectionPriority] = useState<SelectionPriority>(
    initialData.selectionPriority || 'reliability'
  );

  const [defaultDeliverySpeed, setDefaultDeliverySpeed] = useState<DeliverySpeed>(
    initialData.defaultDeliverySpeed || 'dawn'
  );
  const [defaultHandoff, setDefaultHandoff] = useState<HandoffType>(
    initialData.defaultHandoff || 'doorstep-photo'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ageAnalysis = useMemo(() => parseAndAnalyzeRRN(rrnInput), [rrnInput]);

  const invalidateVerification = () => {
    if (identityToken || challengeId) {
      setIdentityToken(null);
      setChallengeId(null);
      setDemoOtpBanner(null);
      setOtpInput('');
    }
  };

  const handleFillExample = (mode: 'adult' | 'minor') => {
    invalidateVerification();
    setErrorMsg(null);

    if (mode === 'adult') {
      setRecipientName('김서연');
      setRrnFront('950312');
      setRrnBack('2145821');
      setCustomsClearanceNumber('P123456789012');
      setPhone('010-4821-9034');
      setAddress('서울시 성동구 서울숲2길 32-14, 402호');
      setAllowOverseasShipping(true);
      setPreferredCategories(['컴퓨터 · 주변기기', '생활 · 주방가전', '주류 · 성인 전용 기호품']);
    } else {
      setRecipientName('박지훈');
      setRrnFront('090724');
      setRrnBack('3182941');
      setCustomsClearanceNumber('P987654321098');
      setPhone('010-7320-1942');
      setAddress('서울시 마포구 월드컵북로 120, 804호');
      setAllowOverseasShipping(true);
      setPreferredCategories(['컴퓨터 · 주변기기', '도서 · 매거진']);
    }
  };

  const handleSendVerification = async () => {
    setErrorMsg(null);
    if (!recipientName.trim()) {
      setErrorMsg('실제 법적 성명을 먼저 입력해 주세요.');
      return;
    }
    if (!ageAnalysis) {
      setErrorMsg('주민등록번호가 양식과 맞지 않습니다. 다시 작성해주십시오.');
      return;
    }
    if (!isValidCustomsCode(customsClearanceNumber)) {
      setErrorMsg('개인통관고유부호가 양식과 맞지 않습니다. 다시 작성해주십시오.');
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMsg('본인 명의 휴대폰 번호가 양식과 맞지 않습니다. 다시 작성해주십시오.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/verify/identity/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          residentRegistrationNumber: rrnInput,
          customsClearanceNumber: customsClearanceNumber.trim().toUpperCase(),
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || '본인확인 인증번호 발송에 실패했습니다.');
      }
      setChallengeId(data.challengeId);
      setDemoOtpBanner(
        `[SMS 수신함] ${data.maskedPhone} · 개인통관고유부호·주민등록번호 대조 인증번호 [${data.demoOtpCode}]를 입력해 주세요.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '인증 요청에 실패했습니다.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!challengeId || !otpInput.trim()) return;
    setErrorMsg(null);
    setIsConfirmingOtp(true);
    try {
      const res = await fetch('/api/verify/identity/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          otpCode: otpInput.trim(),
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || '인증번호 확인에 실패했습니다.');
      }
      setIdentityToken(data.identityVerificationToken);
      setDemoOtpBanner(null);
      if (data.ageAnalysis?.isMinor) {
        setPreferredCategories((prev) => {
          const filtered = prev.filter((c) => c !== '주류 · 성인 전용 기호품');
          return filtered.length > 0 ? filtered : ['컴퓨터 · 주변기기', '도서 · 매거진'];
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      setIsConfirmingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recipientName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('실제 성명, 휴대폰 번호, 배송지 주소를 모두 입력해 주세요.');
      return;
    }
    if (!ageAnalysis) {
      setErrorMsg('유효한 주민등록번호 13자리를 입력해 주세요.');
      return;
    }
    if (!isValidCustomsCode(customsClearanceNumber)) {
      setErrorMsg('개인통관고유부호가 양식과 맞지 않습니다. 다시 작성해주십시오.');
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMsg('본인 명의 휴대폰 번호가 양식과 맞지 않습니다. 다시 작성해주십시오.');
      return;
    }
    if (!identityToken) {
      setErrorMsg(
        '개인통관고유부호와 주민등록번호의 휴대폰 상호 본인인증을 먼저 완료해 주세요.'
      );
      return;
    }

    let sanitizedCategories = ageAnalysis.isMinor
      ? preferredCategories.filter((c) => c !== '주류 · 성인 전용 기호품')
      : preferredCategories;

    if (sanitizedCategories.length === 0) {
      sanitizedCategories = ageAnalysis.isMinor
        ? ['컴퓨터 · 주변기기', '도서 · 매거진']
        : ['컴퓨터 · 주변기기'];
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: true,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          customsClearanceNumber: customsClearanceNumber.trim().toUpperCase(),
          residentRegistrationNumber: rrnInput,
          identityVerificationToken: identityToken,
          allowOverseasShipping,
          preferredCategories: sanitizedCategories,
          selectionPriority,
          defaultDeliverySpeed,
          defaultHandoff,
        }),
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || '초기 설정 저장 중 오류가 발생했습니다.');
      }

      onCompleted({
        onboarding: data.onboarding as UserOnboardingProfile,
        profile: data.profile as LearnedProfile,
        recommendations: data.recommendations as AIRecommendationsResponse,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '초기 설정 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">
      <header className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="text-lg font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0">
            SUNBYEOL
          </span>
          <span className="text-xs text-[#52525B] whitespace-nowrap">
            본인확인 · 주민등록번호·통관부호 상호인증 · 초기 설정
          </span>
        </div>
      </header>

      <main className="max-w-[1120px] mx-auto px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E4E4E7]">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-[#1D4ED8]">앱 이용 전 본인확인 · 필수 설정</p>
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-[#18181B]">
              실명 · 주민등록번호 · 개인통관고유부호 상호 인증 후 시작해 주세요
            </h1>
            <p className="text-sm text-[#52525B] leading-relaxed">
              주민등록번호로 연령대를 분석하여 미성년자 보호 품목 구매를 자동 관리하며, 휴대폰 인증으로 주민등록번호와 통관부호 일치 여부를 확인한 뒤 모든 스토어·검색 기능을 이용할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleFillExample('adult')}
              className="px-3.5 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              성인(30대) 예시 채우기
            </button>
            <button
              type="button"
              onClick={() => handleFillExample('minor')}
              className="px-3.5 py-2 text-xs font-medium text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              미성년자(10대) 예시 채우기
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-10">
          {errorMsg && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-3 text-sm text-[#B91C1C]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Legal Name + Immutable RRN + Immutable PCCC + Phone Cross-Verification */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2">
              <p className="text-xs font-mono text-[#71717A]">01.</p>
              <h2 className="text-lg font-semibold text-[#18181B]">
                실명 · 주민등록번호 · 통관부호 본인인증
              </h2>
              <p className="text-xs text-[#52525B] leading-relaxed">
                주민등록번호와 개인통관고유부호는 등록 후 수정할 수 없으며, 실제 이름은 개명 신청 요청 양식을 통해서만 변경할 수 있습니다.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ob-name" className="block text-xs font-medium text-[#52525B] mb-1.5">
                    실제 법적 성명 <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="ob-name"
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => {
                      setRecipientName(e.target.value);
                      invalidateVerification();
                    }}
                    placeholder="예: 홍길동"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                  <p className="text-[11px] text-[#71717A] mt-1">
                    등록 후 개명 신고 양식을 통해서만 변경 가능
                  </p>
                </div>

                <div>
                  <label htmlFor="ob-rrn-front" className="block text-xs font-medium text-[#52525B] mb-1.5">
                    주민등록번호 (앞 6자리 - 뒤 7자리 · 변경 불가) <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="ob-rrn-front"
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={14}
                      value={rrnFront}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        if (digits.length > 6) {
                          setRrnFront(digits.slice(0, 6));
                          setRrnBack(digits.slice(6, 13));
                          rrnBackRef.current?.focus();
                        } else {
                          setRrnFront(digits);
                          if (digits.length === 6) {
                            rrnBackRef.current?.focus();
                          }
                        }
                        invalidateVerification();
                      }}
                      placeholder="예: 950312"
                      aria-label="주민등록번호 앞 6자리"
                      className={`w-full px-3 py-2.5 text-sm font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] ${
                        (rrnFront.length > 0 || rrnBack.length > 0) && !ageAnalysis
                          ? 'border-[#DC2626]'
                          : 'border-[#D4D4D8]'
                      }`}
                    />
                    <span className="text-sm font-mono text-[#71717A] shrink-0">-</span>
                    <input
                      ref={rrnBackRef}
                      id="ob-rrn-back"
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={7}
                      value={rrnBack}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
                        setRrnBack(digits);
                        invalidateVerification();
                      }}
                      placeholder="예: 1234567"
                      aria-label="주민등록번호 뒤 7자리"
                      className={`w-full px-3 py-2.5 text-sm font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] ${
                        (rrnFront.length > 0 || rrnBack.length > 0) && !ageAnalysis
                          ? 'border-[#DC2626]'
                          : 'border-[#D4D4D8]'
                      }`}
                    />
                  </div>
                  {(rrnFront.length > 0 || rrnBack.length > 0) && !ageAnalysis && (
                    <p className="text-[11px] font-medium text-[#DC2626] mt-1">
                      양식과 맞지 않습니다 다시 작성해주십시오
                    </p>
                  )}
                  <p className="text-[11px] text-[#71717A] mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>등록 완료 후 절대 수정 불가</span>
                  </p>
                </div>
              </div>

              {/* Live Age Analysis Display */}
              {ageAnalysis && (
                <div
                  className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
                    ageAnalysis.isMinor
                      ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                      : 'bg-[#F8FAFC] border-[#DBEAFE] text-[#1E40AF]'
                  }`}
                >
                  {ageAnalysis.isMinor ? (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#1D4ED8]" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      주민등록번호 연령 분석: {ageAnalysis.birthYear}년생 · 만 {ageAnalysis.age}세 ({ageAnalysis.ageGroup})
                    </p>
                    <p>
                      {ageAnalysis.isMinor
                        ? '만 19세 미만 미성년자로 판별되어 주류·담배 등 성인 전용 제한 물품의 구매 및 추천이 자동으로 차단됩니다.'
                        : '만 19세 이상 성인으로 판별되어 모든 카테고리 상품 구매 및 상품 검색을 이용할 수 있습니다.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ob-pccc" className="block text-xs font-medium text-[#52525B] mb-1.5">
                    개인통관고유부호 (변경 불가) <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="ob-pccc"
                    type="text"
                    required
                    maxLength={13}
                    value={customsClearanceNumber}
                    onChange={(e) => {
                      setCustomsClearanceNumber(e.target.value.toUpperCase());
                      invalidateVerification();
                    }}
                    placeholder="예: P123456789012"
                    className={`w-full px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] ${
                      customsClearanceNumber.trim().length > 0 &&
                      !isValidCustomsCode(customsClearanceNumber)
                        ? 'border-[#DC2626]'
                        : 'border-[#D4D4D8]'
                    }`}
                  />
                  {customsClearanceNumber.trim().length > 0 &&
                    !isValidCustomsCode(customsClearanceNumber) && (
                      <p className="text-[11px] font-medium text-[#DC2626] mt-1">
                        양식과 맞지 않습니다 다시 작성해주십시오
                      </p>
                    )}
                </div>

                <div>
                  <label htmlFor="ob-phone" className="block text-xs font-medium text-[#52525B] mb-1.5">
                    본인 명의 휴대폰 번호 (&apos;-&apos; 포함 · 상호 대조 인증용){' '}
                    <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="ob-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      invalidateVerification();
                    }}
                    placeholder="예: 010-9999-9999"
                    className={`w-full px-3.5 py-2.5 text-sm font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] ${
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
              </div>

              {/* Phone Cross-Verification Widget */}
              <div className="p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#18181B]">
                      개인통관고유부호 · 주민등록번호 휴대폰 상호 일치 확인
                    </p>
                    <p className="text-[11px] text-[#71717A]">
                      실명·주민등록번호·통관부호·휴대폰 명의가 동일인인지 휴대폰 인증번호로 검증해야 등록됩니다.
                    </p>
                  </div>
                  {identityToken ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] whitespace-nowrap shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>상호 대조 인증 완료</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={isSendingOtp}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#93C5FD] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PhoneCall className="w-3.5 h-3.5" />
                      )}
                      <span>{challengeId ? '인증번호 재발송' : '휴대폰 상호 인증번호 받기'}</span>
                    </button>
                  )}
                </div>

                {demoOtpBanner && !identityToken && (
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1E40AF] font-medium">
                    {demoOtpBanner}
                  </div>
                )}

                {challengeId && !identityToken && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="인증번호 6자리 입력"
                      className="sm:w-52 px-3.5 py-2 text-sm font-mono tracking-widest bg-white border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmVerification}
                      disabled={isConfirmingOtp || otpInput.length < 6}
                      className="px-4 py-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] rounded-lg transition-colors cursor-pointer"
                    >
                      {isConfirmingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>인증번호 확인 및 명의 대조</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="ob-addr" className="block text-xs font-medium text-[#52525B] mb-1.5">
                  기본 배송지 주소 <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="ob-addr"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 서울특별시 강남구 테헤란로 152, 402호"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#52525B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverseasShipping}
                  onChange={(e) => setAllowOverseasShipping(e.target.checked)}
                  className="w-4 h-4 accent-[#1D4ED8] rounded"
                />
                <span>해외 직배송 상품도 AI 추천 및 검색 결과에 포함</span>
              </label>
            </div>
          </section>

          {/* Section 2: 2-Step Category + Price/Reliability Selection Criteria */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-[#E4E4E7]">
            <div className="lg:col-span-4 space-y-2">
              <p className="text-xs font-mono text-[#71717A]">02.</p>
              <h2 className="text-lg font-semibold text-[#18181B]">
                상품 카테고리 · 평가 기준 설정
              </h2>
              <p className="text-xs text-[#52525B] leading-relaxed">
                선호하는 카테고리를 먼저 선택하고, 가격과 판매처 신뢰성(리뷰·별점) 중 어떤 기준을 우선할지 결정하세요.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-[#E4E4E7] rounded-xl p-6">
              <RequirementCriteriaSelector
                selectedCategories={preferredCategories}
                onChangeCategories={setPreferredCategories}
                selectionPriority={selectionPriority}
                onChangeSelectionPriority={setSelectionPriority}
                isMinor={ageAnalysis?.isMinor ?? false}
              />
            </div>
          </section>

          {/* Section 3: Preferred Delivery Method */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-[#E4E4E7]">
            <div className="lg:col-span-4 space-y-2">
              <p className="text-xs font-mono text-[#71717A]">03.</p>
              <h2 className="text-lg font-semibold text-[#18181B]">선호 배송 방식 사전 설정</h2>
              <p className="text-xs text-[#52525B] leading-relaxed">
                제공 업체, 예상 도착일, 추가 비용을 비교해 가장 적합한 기본 배송 방식을 선택하세요.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <DeliveryOptionSelector
                selectedSpeed={defaultDeliverySpeed}
                onSelectSpeed={setDefaultDeliverySpeed}
                customsClearanceNumber={customsClearanceNumber}
              />

              <div className="bg-white border border-[#E4E4E7] rounded-xl p-5">
                <label htmlFor="ob-handoff" className="block text-xs font-medium text-[#52525B] mb-1.5">
                  기본 수령 방식
                </label>
                <select
                  id="ob-handoff"
                  value={defaultHandoff}
                  onChange={(e) => setDefaultHandoff(e.target.value as HandoffType)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-[#D4D4D8] rounded-lg"
                >
                  {HANDOFF_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-[#E4E4E7] space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-2.5 text-xs text-[#B91C1C]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#71717A] space-y-1">
                <p>
                  주민등록번호·통관부호는 고정되며, 실제 성명은 개명 신청 양식으로 변경할 수 있습니다.
                </p>
                {identityToken ? (
                  <p className="text-[#15803D] font-medium">
                    휴대폰 상호 대조 인증이 완료되었습니다. 아래 버튼을 눌러 최종 로그인하세요.
                  </p>
                ) : (
                  <p className="text-[#B45309] font-medium">
                    위 01번 영역에서 휴대폰 상호 대조 인증을 완료해야 최종 로그인할 수 있습니다.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !identityToken}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>설정 저장 및 AI 초기 학습 중...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {identityToken
                        ? '본인인증 완료 및 스토어 시작하기'
                        : '휴대폰 대조 인증 후 시작 가능'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
