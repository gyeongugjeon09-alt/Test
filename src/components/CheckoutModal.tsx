import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, Lock, Package, ShieldAlert, X } from 'lucide-react';
import {
  HANDOFF_OPTIONS,
  formatKrw,
  formatOrderDateTime,
  formatShippingFee,
  getDeliveryMeta,
  getDeliverySpeedLabel,
  getEstimatedArrivalDateString,
  getHandoffLabel,
  getSelectionPriorityLabel,
} from '../shared/catalog.ts';
import { parseJsonResponse } from '../shared/http.ts';
import type {
  AIRecommendationsResponse,
  DeliverySpeed,
  HandoffType,
  LearnedProfile,
  OrderPreferenceInput,
  OrderRecord,
  UserOnboardingProfile,
} from '../shared/types.ts';
import type { CartItem } from './CartDrawer.tsx';
import { DeliveryOptionSelector } from './DeliveryOptionSelector.tsx';
import { ProductImage } from './ProductImage.tsx';
import { StarRating } from './StarRating.tsx';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onboarding: UserOnboardingProfile;
  profile: LearnedProfile;
  initialPreferenceOverride?: Partial<OrderPreferenceInput> | null;
  initialAddressOverride?: string | null;
  onOrderCompleted: (
    order: OrderRecord,
    updatedProfile: LearnedProfile,
    updatedRecommendations?: AIRecommendationsResponse,
    updatedOnboarding?: UserOnboardingProfile
  ) => void;
  onGoToSearch: () => void;
  onGoToDeliveryTracking: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  onboarding,
  profile,
  initialPreferenceOverride,
  initialAddressOverride,
  onOrderCompleted,
  onGoToSearch,
  onGoToDeliveryTracking,
}: CheckoutModalProps) {
  const [address, setAddress] = useState(onboarding.address || '');

  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>(
    onboarding.defaultDeliverySpeed || 'dawn'
  );
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [handoffType, setHandoffType] = useState<HandoffType>(
    onboarding.defaultHandoff || 'doorstep-photo'
  );
  const [deliveryNote, setDeliveryNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(4);

  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      setCompletedOrder(null);
      setErrorMsg(null);
      return;
    }

    if (wasOpenRef.current) {
      return;
    }
    wasOpenRef.current = true;

    setCompletedOrder(null);
    setSecondsLeft(4);
    setErrorMsg(null);

    setAddress(initialAddressOverride || onboarding.address || '');

    setDeliverySpeed(
      initialPreferenceOverride?.deliverySpeed ??
        (profile.orderCount > 0
          ? profile.learnedDelivery.preferredSpeed
          : onboarding.defaultDeliverySpeed)
    );
    setHandoffType(
      initialPreferenceOverride?.handoffType ??
        (profile.orderCount > 0
          ? profile.learnedDelivery.preferredHandoff
          : onboarding.defaultHandoff)
    );
    setDeliveryNote(
      initialPreferenceOverride?.deliveryNote ??
        (profile.orderCount > 0
          ? profile.learnedDelivery.deliveryRuleSummary
          : '초인종 누르지 말고 문 앞에 둔 뒤 사진으로 안내해 주세요.')
    );
  }, [isOpen, onboarding, profile, initialPreferenceOverride, initialAddressOverride]);

  // Auto-close order confirmation window after 4 seconds (3~4s) unless closed earlier
  useEffect(() => {
    if (!isOpen || !completedOrder) return;
    setSecondsLeft(4);

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      onCloseRef.current();
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, completedOrder]);

  if (!isOpen) return null;

  const hasBlockedMinorItem =
    onboarding.isMinor && items.some((i) => Boolean(i.product.attributes.isAgeRestricted));

  const itemsSubtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const baseProductShippingFee =
    items.length > 0 ? Math.max(...items.map((i) => i.product.attributes.shippingFee)) : 0;
  const deliveryMeta = getDeliveryMeta(deliverySpeed);
  const optionExtraFee =
    deliverySpeed === 'dawn' && itemsSubtotal >= 50000 ? 0 : deliveryMeta.extraFee;
  const deliveryFee =
    deliverySpeed === 'dawn' && itemsSubtotal >= 50000 && baseProductShippingFee === 0
      ? 0
      : Math.max(0, baseProductShippingFee + optionExtraFee);
  const totalAmount = Math.max(0, itemsSubtotal + deliveryFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || hasBlockedMinorItem) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          recipientName: onboarding.recipientName,
          address,
          preferences: {
            preferredCategories:
              profile.preferredCategories.length > 0
                ? profile.preferredCategories
                : onboarding.preferredCategories,
            selectionPriority: profile.selectionPriority || onboarding.selectionPriority,
            deliverySpeed,
            scheduledDate: deliverySpeed === 'scheduled' ? scheduledDate : undefined,
            handoffType,
            deliveryNote,
          },
        }),
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || '주문 처리 중 오류가 발생했습니다.');
      }

      setCompletedOrder(data.order as OrderRecord);
      onOrderCompleted(
        data.order as OrderRecord,
        data.profile as LearnedProfile,
        data.recommendations as AIRecommendationsResponse | undefined,
        data.onboarding as UserOnboardingProfile | undefined
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '주문 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="주문 및 요건 · 배송 방식 지정"
    >
      <div className="fixed inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl border border-[#E4E4E7] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div>
            <h2 className="text-base font-semibold text-[#18181B]">
              {completedOrder ? '주문이 완료되었습니다' : '주문서 작성 · 배송 방식 지정'}
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              {completedOrder
                ? `주문번호 ${completedOrder.id} · 접수 ${formatOrderDateTime(completedOrder.createdAt)} · ${secondsLeft}초 후 창이 자동으로 닫힙니다`
                : '제공 업체, 예상 도착일, 추가 비용 및 수령 방식을 선택해 주문하세요.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] rounded-lg hover:bg-[#E4E4E7]/50 transition-colors cursor-pointer"
          >
            {completedOrder && <span>창 닫기</span>}
            <X className="w-4 h-4" />
          </button>
        </div>

        {completedOrder ? (
          <div className="p-6 md:p-8 overflow-y-auto space-y-5">
            <div className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-7 h-7 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xl font-semibold text-[#18181B]">
                    주문이 완료되었습니다
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#15803D] mt-1.5">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums bg-white/80 px-2 py-0.5 rounded border border-[#BBF7D0]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>주문 접수 시각: {formatOrderDateTime(completedOrder.createdAt)}</span>
                    </span>
                    <span className="font-mono text-[#52525B]">주문번호 {completedOrder.id}</span>
                  </div>
                  <p className="text-sm text-[#52525B] mt-1.5">
                    {completedOrder.recipientName}님 · {completedOrder.address}
                    {completedOrder.customsClearanceNumber &&
                      ` · 통관부호 ${completedOrder.customsClearanceNumber}`}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-3 py-1.5 text-xs font-mono font-semibold text-[#15803D] bg-white border border-[#BBF7D0] rounded-lg">
                  {secondsLeft}초 후 자동 닫힘
                </span>
              </div>
            </div>

            {/* Compact Order Summary UI shown before navigating to 주문 내역 */}
            {(() => {
              const totalQuantity = completedOrder.items.reduce((sum, item) => sum + item.quantity, 0);
              const primaryItem = completedOrder.items[0];
              const extraCount = completedOrder.items.length - 1;
              const itemsSummaryText = primaryItem
                ? extraCount > 0
                  ? `${primaryItem.productName} 외 ${extraCount}건`
                  : primaryItem.productName
                : '주문 상품';

              return (
                <section
                  aria-label="주문 요약 데이터"
                  className="p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
                      <Package className="w-4 h-4 text-[#1D4ED8]" />
                      <span>주문 요약 데이터</span>
                    </div>
                    <span className="text-[11px] text-[#71717A]">
                      주문 내역 탭 이동 전 핵심 요약
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#E4E4E7] rounded-lg space-y-1">
                      <p className="text-[11px] text-[#71717A]">접수 시각</p>
                      <p className="font-mono tabular-nums font-semibold text-[#18181B]">
                        {formatOrderDateTime(completedOrder.createdAt)}
                      </p>
                      <p className="text-[11px] text-[#15803D] font-medium">{completedOrder.status}</p>
                    </div>

                    <div className="p-3 bg-white border border-[#E4E4E7] rounded-lg space-y-1">
                      <p className="text-[11px] text-[#71717A]">주문 상품 · 수량</p>
                      <p className="font-semibold text-[#18181B] truncate" title={itemsSummaryText}>
                        {itemsSummaryText}
                      </p>
                      <p className="text-[11px] text-[#52525B]">
                        총 <span className="font-mono tabular-nums font-medium">{totalQuantity}</span>개 ({completedOrder.items.length}종)
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-[#E4E4E7] rounded-lg space-y-1">
                      <p className="text-[11px] text-[#71717A]">총 결제 금액</p>
                      <p className="font-mono tabular-nums font-semibold text-sm text-[#18181B]">
                        {formatKrw(completedOrder.totalAmount)}
                      </p>
                      <p className="text-[11px] text-[#52525B]">
                        배송비{' '}
                        {completedOrder.deliveryFee === 0
                          ? '무료'
                          : `${completedOrder.deliveryFee > 0 ? '+' : ''}${formatKrw(
                              completedOrder.deliveryFee
                            )}`}
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-[#E4E4E7] rounded-lg space-y-1">
                      <p className="text-[11px] text-[#71717A]">배송 · 예상 도착</p>
                      <p className="font-semibold text-[#18181B] truncate">
                        {getDeliverySpeedLabel(completedOrder.preferences.deliverySpeed)} ·{' '}
                        {completedOrder.deliveryCarrier}
                      </p>
                      <p className="text-[11px] text-[#1D4ED8] font-medium truncate">
                        {completedOrder.estimatedArrivalDate} · {getHandoffLabel(completedOrder.preferences.handoffType)}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })()}

            <div className="p-5 bg-[#F8FAFC] border border-[#DBEAFE] rounded-lg space-y-2">
              <p className="text-xs font-semibold text-[#1D4ED8]">이번 주문에서 AI가 학습한 내용</p>
              <p className="text-sm text-[#18181B] leading-relaxed">
                {completedOrder.aiLearningNote}
              </p>
            </div>

            <div className="border-t border-[#E4E4E7] pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-[#71717A] mb-2">주문 상품 및 결제 내역</p>
                <ul className="space-y-1.5">
                  {completedOrder.items.map((item) => (
                    <li key={item.productId} className="flex justify-between text-[#18181B]">
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatKrw(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between text-xs text-[#52525B] pt-1">
                    <span>배송비 ({completedOrder.deliveryCarrier})</span>
                    <span className="font-mono tabular-nums">
                      {completedOrder.deliveryFee === 0
                        ? '무료'
                        : `${completedOrder.deliveryFee > 0 ? '+' : ''}${formatKrw(
                            completedOrder.deliveryFee
                          )}`}
                    </span>
                  </li>
                </ul>
                <div className="mt-3 pt-3 border-t border-[#E4E4E7] flex justify-between font-semibold text-[#18181B]">
                  <span>총 결제 금액</span>
                  <span className="font-mono tabular-nums">{formatKrw(completedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#71717A] mb-2">지정된 기준 · 배송 메모</p>
                {completedOrder.preferences.preferredCategories && (
                  <p className="text-xs text-[#52525B]">
                    <span className="text-[#18181B] font-medium">선호 카테고리: </span>
                    {completedOrder.preferences.preferredCategories.join(' · ')}
                  </p>
                )}
                {completedOrder.preferences.selectionPriority && (
                  <p className="text-xs text-[#52525B]">
                    <span className="text-[#18181B] font-medium">선택 기준: </span>
                    {getSelectionPriorityLabel(completedOrder.preferences.selectionPriority)}
                  </p>
                )}
                <p className="text-xs text-[#52525B]">
                  <span className="text-[#18181B] font-medium">배송 메모: </span>
                  {completedOrder.preferences.deliveryNote || '없음'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E4E7] flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors cursor-pointer"
              >
                창 닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToDeliveryTracking();
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
              >
                주문 내역 · 배송 현황 보기
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToSearch();
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
              >
                학습된 기준으로 상품 검색하기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="p-6 md:p-8 space-y-8">
              {hasBlockedMinorItem && (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-3 text-sm text-[#B91C1C]">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    만 19세 미만 미성년자({onboarding.ageGroup}) 계정은 주류 등 성인 전용 제한 물품을 구매할 수 없습니다.
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-3 text-sm text-[#B91C1C]">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <section>
                <h3 className="text-sm font-semibold text-[#18181B] mb-3">01. 주문 상품 확인</h3>
                <div className="divide-y divide-[#E4E4E7] border border-[#E4E4E7] rounded-lg">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 aspect-[4/3] bg-[#F4F4F5] rounded overflow-hidden shrink-0">
                          <ProductImage src={product.image} alt={product.name} className="w-full h-full" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 text-xs text-[#71717A]">
                            <span>{product.brand}</span>
                            <span aria-hidden="true">·</span>
                            <StarRating
                              compact
                              rating={product.attributes.sellerRating}
                              reviewCount={product.attributes.reviewCount}
                            />
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                product.attributes.shippingFee === 0
                                  ? 'text-[#15803D] font-medium'
                                  : 'text-[#52525B]'
                              }
                            >
                              {formatShippingFee(product.attributes.shippingFee)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[#18181B] truncate">
                            {product.name} × {quantity}
                          </p>
                          <p className="text-xs text-[#52525B]">{product.attributes.origin}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[#18181B] shrink-0">
                        {formatKrw(product.price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#18181B]">
                    02. 배송 방식 선택 (제공 업체 · 예상 도착일 · 추가 비용)
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    선택한 배송 옵션과 수령 방식은 AI 프로필에 학습되어 다음 검색에 활용됩니다.
                  </p>
                </div>

                <DeliveryOptionSelector
                  selectedSpeed={deliverySpeed}
                  onSelectSpeed={setDeliverySpeed}
                  scheduledDate={scheduledDate}
                  onChangeScheduledDate={setScheduledDate}
                  customsClearanceNumber={onboarding.customsClearanceNumber}
                  cartProducts={items.map((i) => i.product)}
                  subtotal={itemsSubtotal}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label htmlFor="handoff-select" className="block text-xs font-medium text-[#52525B] mb-1.5">
                      수령 방식
                    </label>
                    <select
                      id="handoff-select"
                      value={handoffType}
                      onChange={(e) => setHandoffType(e.target.value as HandoffType)}
                      className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg"
                    >
                      {HANDOFF_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="delivery-note" className="block text-xs font-medium text-[#52525B] mb-1.5">
                      배송 요청 메모
                    </label>
                    <input
                      id="delivery-note"
                      type="text"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      placeholder="예: 벨 누르지 말고 현관 앞 비대면 배치 후 사진 전송 부탁드립니다."
                      className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#18181B]">03. 본인확인 · 통관 · 배송지</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-[#52525B]">
                    <Lock className="w-3 h-3" />
                    <span>
                      주민번호 {onboarding.residentRegistrationNumberMasked} · 통관부호 {onboarding.customsClearanceNumber}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#52525B] mb-1.5">
                      실명 수령인 (개명 신청으로만 변경)
                    </label>
                    <div className="px-3.5 py-2.5 text-sm font-medium text-[#18181B] bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg">
                      {onboarding.recipientName}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="recipient-addr" className="block text-xs font-medium text-[#52525B] mb-1.5">
                      배송 주소
                    </label>
                    <input
                      id="recipient-addr"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="예: 서울특별시 강남구 테헤란로 152, 402호"
                      className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs text-[#52525B]">
                <p>
                  상품 {formatKrw(itemsSubtotal)} · 상품 기본배송{' '}
                  <span className="font-mono tabular-nums text-[#18181B]">
                    {baseProductShippingFee === 0 ? '무료' : formatKrw(baseProductShippingFee)}
                  </span>{' '}
                  · 선택 옵션({deliveryMeta.carrier}){' '}
                  <span className="font-mono tabular-nums font-medium text-[#18181B]">
                    {optionExtraFee === 0
                      ? '무료'
                      : `${optionExtraFee > 0 ? '+' : ''}${formatKrw(optionExtraFee)}`}
                  </span>{' '}
                  = 총 배송비{' '}
                  <span className="font-mono tabular-nums font-semibold text-[#18181B]">
                    {deliveryFee === 0 ? '무료' : formatKrw(deliveryFee)}
                  </span>
                </p>
                <p className="text-sm text-[#18181B] font-semibold">
                  총 결제 금액{' '}
                  <span className="text-lg font-mono tabular-nums ml-1.5">
                    {formatKrw(totalAmount)}
                  </span>
                  <span className="text-xs font-normal text-[#71717A] ml-2">
                    ({getEstimatedArrivalDateString(deliverySpeed, scheduledDate)})
                  </span>
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || hasBlockedMinorItem}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#A1A1AA] rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {hasBlockedMinorItem
                    ? '미성년자 구매 제한'
                    : isSubmitting
                    ? '주문 처리 및 AI 학습 중...'
                    : '주문 확정 및 AI 학습하기'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
