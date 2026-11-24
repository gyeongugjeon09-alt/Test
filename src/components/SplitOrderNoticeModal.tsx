import { AlertTriangle, ArrowRight, CheckCircle2, MapPin, Package, Truck, X } from 'lucide-react';
import {
  formatKrw,
  formatShippingFee,
  getDeliveryMeta,
  getDeliverySpeedLabel,
  getEstimatedArrivalDateString,
} from '../shared/catalog.ts';
import type { DeliverySpeed, OrderRecord } from '../shared/types.ts';
import type { CartItem } from './CartDrawer.tsx';
import { ProductImage } from './ProductImage.tsx';

export interface SplitOrderGroup {
  groupKey: string;
  deliveryAddress: string;
  deliverySpeed: DeliverySpeed;
  items: CartItem[];
  completedOrder?: OrderRecord;
}

interface SplitOrderNoticeModalProps {
  isOpen: boolean;
  groups: SplitOrderGroup[];
  defaultAddress: string;
  onClose: () => void;
  onProcessGroup: (group: SplitOrderGroup) => void;
  onProcessNextPending: () => void;
}

export function SplitOrderNoticeModal({
  isOpen,
  groups,
  defaultAddress,
  onClose,
  onProcessGroup,
  onProcessNextPending,
}: SplitOrderNoticeModalProps) {
  if (!isOpen || groups.length === 0) return null;

  const distinctAddresses = new Set(groups.map((g) => g.deliveryAddress.trim())).size;
  const distinctSpeeds = new Set(groups.map((g) => g.deliverySpeed)).size;
  const completedCount = groups.filter((g) => Boolean(g.completedOrder)).length;
  const pendingGroups = groups.filter((g) => !g.completedOrder);
  const firstPendingIndex = groups.findIndex((g) => !g.completedOrder);
  const allCompleted = pendingGroups.length === 0;

  let splitReasonText = `체크하신 상품에 배송지 또는 배송 방식이 서로 다른 항목이 섞여 있어 총 ${groups.length}건의 주문으로 분리해 각각 진행합니다.`;
  if (distinctAddresses > 1 && distinctSpeeds > 1) {
    splitReasonText = `체크하신 상품에 서로 다른 배송지(${distinctAddresses}곳)와 배송 방식(${distinctSpeeds}종)이 함께 포함되어 있어 총 ${groups.length}건의 주문으로 나누어 결제해야 합니다.`;
  } else if (distinctAddresses > 1) {
    splitReasonText = `체크하신 상품에 서로 다른 배송지(${distinctAddresses}곳)가 지정되어 있어 총 ${groups.length}건의 주문으로 분리하여 각각 결제해야 합니다.`;
  } else if (distinctSpeeds > 1) {
    splitReasonText = `체크하신 상품에 서로 다른 배송 방식(${distinctSpeeds}종)이 선택되어 있어 총 ${groups.length}건의 주문으로 분리하여 각각 결제해야 합니다.`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="배송지 및 배송 방식 상이 분리 주문 안내"
    >
      <div className="fixed inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl border border-[#E4E4E7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            {allCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
            )}
            <div>
              <h2 className="text-base font-semibold text-[#18181B]">
                {allCompleted
                  ? '분리된 모든 주문이 완료되었습니다'
                  : '배송지 · 배송 방식이 달라 분리 주문이 필요합니다'}
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                결제 전단계 안내 · 그룹 {groups.length}건 중 {completedCount}건 완료
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="안내 모달 닫기"
            className="p-2 text-[#52525B] hover:text-[#18181B] rounded-lg hover:bg-[#E4E4E7]/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              allCompleted
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
            }`}
          >
            <p className="font-semibold text-sm mb-1">
              {allCompleted
                ? '모든 분리 주문 그룹이 정상 접수되었습니다.'
                : `총 ${groups.length}개 주문 그룹으로 묶어 안내해 드립니다`}
            </p>
            <p>{splitReasonText}</p>
            {!allCompleted && completedCount > 0 && (
              <p className="mt-1.5 font-medium text-[#15803D]">
                현재 {completedCount}건 결제 완료 · 남은 {pendingGroups.length}개 그룹을 이어서 주문할 수 있습니다.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {groups.map((group, idx) => {
              const deliveryMeta = getDeliveryMeta(group.deliverySpeed);
              const itemsSubtotal = group.items.reduce(
                (sum, item) => sum + item.product.price * item.quantity,
                0
              );
              const baseShipping = Math.max(
                ...group.items.map((item) => item.product.attributes.shippingFee)
              );
              const optionExtraFee =
                group.deliverySpeed === 'dawn' && itemsSubtotal >= 50000
                  ? 0
                  : deliveryMeta.extraFee;
              const estimatedDeliveryFee =
                group.deliverySpeed === 'dawn' && itemsSubtotal >= 50000 && baseShipping === 0
                  ? 0
                  : Math.max(0, baseShipping + optionExtraFee);

              const isDefaultAddress =
                defaultAddress.trim() !== '' &&
                group.deliveryAddress.trim() === defaultAddress.trim();
              const isCompleted = Boolean(group.completedOrder);
              const isNextPending = idx === firstPendingIndex;

              return (
                <section
                  key={group.groupKey}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    isCompleted
                      ? 'border-[#BBF7D0] bg-[#F0FDF4]/50'
                      : isNextPending
                      ? 'border-[#1D4ED8] bg-white shadow-sm'
                      : 'border-[#E4E4E7] bg-white'
                  }`}
                >
                  {/* Group Header */}
                  <div className="px-4 py-3 border-b border-[#E4E4E7]/80 bg-[#FAFAFA]/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                          isCompleted
                            ? 'bg-[#15803D] text-white'
                            : isNextPending
                            ? 'bg-[#1D4ED8] text-white'
                            : 'bg-[#18181B] text-white'
                        }`}
                      >
                        주문 그룹 {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#18181B]">
                        {getDeliverySpeedLabel(group.deliverySpeed)}
                      </span>
                      <span className="text-xs text-[#71717A]">
                        · {group.items.length}종 (총{' '}
                        {group.items.reduce((s, it) => s + it.quantity, 0)}개)
                      </span>
                    </div>

                    {isCompleted && group.completedOrder ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>주문 완료 ({group.completedOrder.id})</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-[#52525B]">결제 대기</span>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <div className="px-4 py-3 bg-white border-b border-[#E4E4E7]/70 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[#71717A]">배송지 </span>
                        <span className="text-[11px] font-medium text-[#1D4ED8]">
                          {isDefaultAddress ? '(기본 배송지)' : '(개별 배송지)'}
                        </span>
                        <p className="font-medium text-[#18181B] break-all mt-0.5">
                          {group.deliveryAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Truck className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[#71717A]">배송 방식 · 예상 도착</span>
                        <p className="font-medium text-[#18181B] mt-0.5">
                          {deliveryMeta.carrier} · {getEstimatedArrivalDateString(group.deliverySpeed)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <ul className="divide-y divide-[#E4E4E7]/70 bg-white">
                    {group.items.map(({ product, quantity }) => (
                      <li key={product.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 aspect-[4/3] bg-[#F4F4F5] rounded overflow-hidden shrink-0">
                            <ProductImage
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#18181B] truncate">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-[#71717A] truncate">
                              {product.sellerName} · 수량 {quantity}개 ·{' '}
                              {formatShippingFee(product.attributes.shippingFee)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono tabular-nums font-semibold text-[#18181B] shrink-0">
                          {formatKrw(product.price * quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Group Footer Action */}
                  <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#E4E4E7]/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#52525B]">
                      <span>상품 {formatKrw(itemsSubtotal)}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        예상 배송비{' '}
                        {estimatedDeliveryFee === 0 ? '무료' : formatKrw(estimatedDeliveryFee)}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-semibold text-[#18181B] font-mono tabular-nums">
                        예상 합계 {formatKrw(itemsSubtotal + estimatedDeliveryFee)}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                        <Package className="w-3.5 h-3.5" />
                        <span>분리 주문 처리 완료</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onProcessGroup(group)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isNextPending
                            ? 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white'
                            : 'bg-[#18181B] hover:bg-[#27272A] text-white'
                        }`}
                      >
                        <span>이 그룹 주문하기</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-[#18181B] bg-white border border-[#E4E4E7] hover:border-[#A1A1AA] rounded-lg transition-colors cursor-pointer"
          >
            {allCompleted ? '닫기' : '장바구니로 돌아가기'}
          </button>

          {!allCompleted && (
            <button
              type="button"
              onClick={onProcessNextPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
            >
              <span>
                {completedCount > 0
                  ? `다음 그룹 (주문 그룹 ${firstPendingIndex + 1}) 바로 주문하기`
                  : `주문 그룹 1부터 순서대로 분리 주문하기 (${pendingGroups.length}건)`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
