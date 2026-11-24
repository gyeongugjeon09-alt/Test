import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  PackageCheck,
  Truck,
  X,
} from 'lucide-react';
import {
  formatKrw,
  formatOrderDateTime,
  getDeliverySpeedLabel,
  getHandoffLabel,
  getSelectionPriorityLabel,
} from '../shared/catalog.ts';
import type { OrderRecord } from '../shared/types.ts';
import { ProductImage } from './ProductImage.tsx';

export type OrdersSubTab = 'orders' | 'tracking';

interface OrdersViewProps {
  orders: OrderRecord[];
  activeSubTab: OrdersSubTab;
  onChangeSubTab: (tab: OrdersSubTab) => void;
  justCompletedOrder: OrderRecord | null;
  onDismissCompletedNotice: () => void;
  onGoToStore: () => void;
}

const DELIVERY_STEPS = [
  {
    key: 'confirmed',
    label: '주문 완료 · 결제 확인',
    detail: '주문이 정상 접수되었으며 선호 배송 기준이 AI에 반영되었습니다.',
  },
  {
    key: 'preparing',
    label: '상품 검수 · 출고 준비',
    detail: '물류 센터에서 주문 상품을 검수하고 송장을 발행했습니다.',
  },
  {
    key: 'in-transit',
    label: '집화 · 배송 이동 중',
    detail: '지정된 배송 업체의 전담 차량으로 고객님 지역으로 이동 중입니다.',
  },
  {
    key: 'delivered',
    label: '배송 완료',
    detail: '지정된 수령 방식으로 배송이 완료되었습니다.',
  },
];

function buildTrackingNumber(orderId: string): string {
  const digits = orderId.replace(/\D/g, '') || '20261041';
  return `SB-${digits.padStart(10, '0')}`;
}

export function OrdersView({
  orders,
  activeSubTab,
  onChangeSubTab,
  justCompletedOrder,
  onDismissCompletedNotice,
  onGoToStore,
}: OrdersViewProps) {
  // Optional per-order tracking step simulation state (defaults to stage 1: 상품 검수 · 출고 준비)
  const [stepByOrderId, setStepByOrderId] = useState<Record<string, number>>({});

  const getOrderStep = (order: OrderRecord): number => {
    if (stepByOrderId[order.id] !== undefined) {
      return stepByOrderId[order.id];
    }
    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    if (ageMs > 86400000 * 2) return 3;
    if (ageMs > 86400000 * 0.5) return 2;
    return 1;
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="pb-6 border-b border-[#E4E4E7] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#71717A]">
            총 <span className="font-mono tabular-nums">{orders.length}</span>건의 주문 기록
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#18181B] tracking-tight mt-1">
            주문 내역 · 배송 현황
          </h1>
        </div>
        <button
          type="button"
          onClick={onGoToStore}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          카테고리 둘러보기
        </button>
      </div>

      {/* Order Completed Confirmation Notice inside OrdersView (when an order was confirmed) */}
      {justCompletedOrder && (
        <div
          role="status"
          className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[#18181B]">
                  주문이 완료되었습니다
                </h2>
                <span className="text-xs font-mono text-[#15803D] font-semibold">
                  {justCompletedOrder.id}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-[#15803D] bg-white px-2 py-0.5 rounded border border-[#BBF7D0]">
                  <Clock className="w-3 h-3" />
                  <span>접수 시각: {formatOrderDateTime(justCompletedOrder.createdAt)}</span>
                </span>
              </div>
              <p className="text-xs text-[#52525B]">
                {justCompletedOrder.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')} · 총{' '}
                <strong className="font-mono tabular-nums text-[#18181B]">
                  {formatKrw(justCompletedOrder.totalAmount)}
                </strong>{' '}
                · {justCompletedOrder.deliveryCarrier} · 예상 도착:{' '}
                <strong className="text-[#18181B]">{justCompletedOrder.estimatedArrivalDate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeSubTab !== 'tracking' && (
              <button
                type="button"
                onClick={() => onChangeSubTab('tracking')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                배송 현황 탭 바로 보기
              </button>
            )}
            <button
              type="button"
              onClick={onDismissCompletedNotice}
              aria-label="주문 완료 알림 닫기"
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>창 닫기</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-tabs: Unlocked once at least one order is confirmed */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-3">
          <button
            type="button"
            onClick={() => onChangeSubTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-[#18181B] text-white border-[#18181B]'
                : 'bg-white text-[#52525B] border-[#E4E4E7] hover:text-[#18181B]'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>주문 내역 ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSubTab('tracking')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              activeSubTab === 'tracking'
                ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                : 'bg-white text-[#52525B] border-[#E4E4E7] hover:text-[#18181B]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>배송 현황 ({orders.length})</span>
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-20 text-center bg-white border border-[#E4E4E7] rounded-xl">
          <p className="text-sm font-medium text-[#52525B]">아직 완료된 주문이 없습니다.</p>
          <p className="text-xs text-[#71717A] mt-1">
            상품을 선택해 주문을 확정하면 주문 완료 안내와 함께 배송 현황 탭을 확인할 수 있습니다.
          </p>
        </div>
      ) : activeSubTab === 'orders' ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateLabel = formatOrderDateTime(order.createdAt);
            return (
              <article
                key={order.id}
                className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#E4E4E7] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B]">
                    <span className="font-mono font-semibold text-[#18181B]">{order.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">접수 {dateLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#1D4ED8] font-medium">{order.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-[#18181B]">
                      {formatKrw(order.totalAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeSubTab('tracking')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-md transition-colors cursor-pointer"
                    >
                      <Truck className="w-3 h-3" />
                      <span>배송 현황</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="w-16 aspect-[4/3] bg-[#F4F4F5] rounded overflow-hidden shrink-0">
                          <ProductImage src={item.image} alt={item.productName} className="w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-[#71717A]">{item.brand}</p>
                          <p className="text-sm font-medium text-[#18181B] truncate">
                            {item.productName} × {item.quantity}
                          </p>
                          <p className="text-xs font-mono tabular-nums text-[#52525B]">
                            {formatKrw(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-7 space-y-3 text-xs border-t lg:border-t-0 lg:border-l border-[#E4E4E7] pt-4 lg:pt-0 lg:pl-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[#71717A]">지정한 카테고리 · 선택 기준</p>
                        <p className="text-[#18181B] font-medium mt-0.5">
                          {order.preferences.preferredCategories?.join(' · ') || '기본 설정'}
                        </p>
                        {order.preferences.selectionPriority && (
                          <p className="text-[#52525B] mt-0.5">
                            {getSelectionPriorityLabel(order.preferences.selectionPriority)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[#71717A]">배송 업체 · 예상 도착 · 수령 방식</p>
                        <p className="text-[#18181B] font-medium mt-0.5">
                          {getDeliverySpeedLabel(order.preferences.deliverySpeed)} · {order.deliveryCarrier}
                        </p>
                        <p className="text-[#52525B] mt-0.5">
                          도착: {order.estimatedArrivalDate} · 배송비{' '}
                          {order.deliveryFee === 0
                            ? '무료'
                            : `${order.deliveryFee > 0 ? '+' : ''}${formatKrw(order.deliveryFee)}`}
                        </p>
                        <p className="text-[#52525B] mt-0.5">
                          {getHandoffLabel(order.preferences.handoffType)}
                        </p>
                        {order.customsClearanceNumber && (
                          <p className="text-[#1D4ED8] mt-0.5 font-mono">
                            통관부호: {order.customsClearanceNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {order.aiLearningNote && (
                      <div className="pt-3 border-t border-[#E4E4E7]">
                        <p className="text-[#1D4ED8] font-semibold">AI 학습 기록</p>
                        <p className="text-[#18181B] mt-1 leading-relaxed">{order.aiLearningNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Delivery Status Tracking Tab (배송 현황) */
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStep = getOrderStep(order);
            const trackingNumber = buildTrackingNumber(order.id);
            const currentStageInfo = DELIVERY_STEPS[currentStep];

            return (
              <article
                key={`track-${order.id}`}
                className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E4E4E7] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#1D4ED8]">
                      <Truck className="w-4 h-4" />
                      <span>{currentStageInfo.label}</span>
                    </span>
                    <span aria-hidden="true" className="text-[#A1A1AA]">·</span>
                    <span className="font-mono text-[#52525B]">주문번호 {order.id}</span>
                    <span aria-hidden="true" className="text-[#A1A1AA]">·</span>
                    <span className="font-mono text-[#18181B]">송장 {trackingNumber}</span>
                    <span aria-hidden="true" className="text-[#A1A1AA]">·</span>
                    <span className="font-mono tabular-nums text-[#52525B]">
                      접수 {formatOrderDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#15803D]">
                      예상 도착: {order.estimatedArrivalDate}
                    </span>
                    {currentStep < DELIVERY_STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setStepByOrderId((prev) => ({
                            ...prev,
                            [order.id]: Math.min(DELIVERY_STEPS.length - 1, currentStep + 1),
                          }))
                        }
                        className="px-2.5 py-1 text-[11px] font-medium text-[#1D4ED8] bg-white border border-[#BFDBFE] hover:bg-[#EFF6FF] rounded-md transition-colors cursor-pointer"
                      >
                        다음 배송 단계 확인
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* 4-Step Delivery Progress Stepper */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {DELIVERY_STEPS.map((step, idx) => {
                      const isDone = idx < currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div
                          key={step.key}
                          className={`p-4 rounded-xl border space-y-1.5 ${
                            isCurrent
                              ? 'border-[#1D4ED8] bg-[#EFF6FF]/60'
                              : isDone
                              ? 'border-[#BBF7D0] bg-[#F0FDF4]/60'
                              : 'border-[#E4E4E7] bg-[#FAFAFA]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#71717A]">
                              0{idx + 1}
                            </span>
                            {isDone ? (
                              <PackageCheck className="w-4 h-4 text-[#15803D]" />
                            ) : isCurrent ? (
                              <Truck className="w-4 h-4 text-[#1D4ED8]" />
                            ) : (
                              <Clock className="w-4 h-4 text-[#A1A1AA]" />
                            )}
                          </div>
                          <p
                            className={`text-xs font-semibold ${
                              isCurrent
                                ? 'text-[#1D4ED8]'
                                : isDone
                                ? 'text-[#15803D]'
                                : 'text-[#71717A]'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[11px] text-[#52525B] leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delivery Carrier, Destination & Items Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#E4E4E7] text-xs">
                    <div className="lg:col-span-6 space-y-2">
                      <p className="font-semibold text-[#18181B] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>배송지 및 수령 정보</span>
                      </p>
                      <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg space-y-1 text-[#52525B]">
                        <p>
                          <span className="text-[#71717A]">수령인: </span>
                          <span className="font-medium text-[#18181B]">{order.recipientName}</span>
                        </p>
                        <p>
                          <span className="text-[#71717A]">배송 주소: </span>
                          <span className="font-medium text-[#18181B]">{order.address}</span>
                        </p>
                        <p>
                          <span className="text-[#71717A]">배송 방식 · 업체: </span>
                          <span className="font-medium text-[#18181B]">
                            {getDeliverySpeedLabel(order.preferences.deliverySpeed)} ({order.deliveryCarrier})
                          </span>
                        </p>
                        <p>
                          <span className="text-[#71717A]">수령 방식: </span>
                          <span className="font-medium text-[#18181B]">
                            {getHandoffLabel(order.preferences.handoffType)}
                          </span>
                        </p>
                        {order.preferences.deliveryNote && (
                          <p>
                            <span className="text-[#71717A]">배송 메모: </span>
                            <span className="text-[#18181B]">{order.preferences.deliveryNote}</span>
                          </p>
                        )}
                        {order.customsClearanceNumber && (
                          <p className="font-mono text-[#1D4ED8]">
                            개인통관고유부호: {order.customsClearanceNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-2">
                      <p className="font-semibold text-[#18181B]">배송 상품 ({order.items.length}종)</p>
                      <div className="divide-y divide-[#E4E4E7] border border-[#E4E4E7] rounded-lg">
                        {order.items.map((item) => (
                          <div key={item.productId} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 aspect-[4/3] bg-[#F4F4F5] rounded overflow-hidden shrink-0">
                                <ProductImage src={item.image} alt={item.productName} className="w-full h-full" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-[#18181B] truncate">
                                  {item.productName} × {item.quantity}
                                </p>
                                <p className="text-[#71717A]">{item.brand}</p>
                              </div>
                            </div>
                            <span className="font-mono tabular-nums font-medium text-[#18181B] shrink-0">
                              {formatKrw(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
