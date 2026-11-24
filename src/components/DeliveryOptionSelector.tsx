import {
  DELIVERY_SPEED_OPTIONS,
  getEstimatedArrivalDateString,
  isValidCustomsCode,
} from '../shared/catalog.ts';
import type { DeliverySpeed, Product } from '../shared/types.ts';

interface DeliveryOptionSelectorProps {
  selectedSpeed: DeliverySpeed;
  onSelectSpeed: (speed: DeliverySpeed) => void;
  scheduledDate?: string;
  onChangeScheduledDate?: (dateStr: string) => void;
  customsClearanceNumber?: string;
  cartProducts?: Product[];
  subtotal?: number;
}

export function DeliveryOptionSelector({
  selectedSpeed,
  onSelectSpeed,
  scheduledDate,
  onChangeScheduledDate,
  customsClearanceNumber,
  cartProducts,
  subtotal = 0,
}: DeliveryOptionSelectorProps) {
  const hasValidCustoms = isValidCustomsCode(customsClearanceNumber ?? '');

  // Min date = 2 days from today, Max = 7 days
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 2);
  const minDateIso = minDateObj.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 14);
  const maxDateIso = maxDateObj.toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DELIVERY_SPEED_OPTIONS.map((opt) => {
          const isSelected = selectedSpeed === opt.id;
          const isDawnFree = opt.id === 'dawn' && subtotal >= 50000;
          const feeText = isDawnFree ? '무료 (5만원 이상)' : opt.extraFeeLabel;
          const arrivalText = getEstimatedArrivalDateString(
            opt.id,
            opt.id === 'scheduled' ? scheduledDate : undefined
          );

          const unsupportedItems = cartProducts
            ? cartProducts.filter((p) => !p.supportedDeliveries.includes(opt.id))
            : [];

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectSpeed(opt.id)}
              className={`p-4 text-left rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'border-[#1D4ED8] bg-[#EFF6FF]/60'
                  : 'border-[#E4E4E7] bg-white hover:border-[#A1A1AA]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-[#1D4ED8]' : 'text-[#18181B]'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#18181B] shrink-0">
                    {feeText}
                  </span>
                </div>
                <p className="text-xs text-[#52525B] leading-relaxed">{opt.description}</p>
              </div>

              <div className="pt-2.5 border-t border-[#E4E4E7]/80 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71717A]">제공 업체</span>
                  <span className="font-medium text-[#18181B] truncate">{opt.carrier}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71717A]">예상 도착</span>
                  <span className="font-medium text-[#18181B] tabular-nums text-right">
                    {arrivalText}
                  </span>
                </div>
                {opt.requiresCustomsCode && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#71717A]">통관 요건</span>
                    <span
                      className={`font-medium ${
                        hasValidCustoms ? 'text-[#15803D]' : 'text-[#B45309]'
                      }`}
                    >
                      {hasValidCustoms ? '개인통관고유부호 등록됨' : '개인통관고유부호 필요'}
                    </span>
                  </div>
                )}
                {unsupportedItems.length > 0 && (
                  <p className="text-[#B45309] pt-1">
                    일부 상품({unsupportedItems.map((p) => p.name).join(', ')})은 기본 배송으로 분리 출고됩니다.
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedSpeed === 'scheduled' && onChangeScheduledDate && (
        <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#18181B]">희망 도착 날짜 지정</p>
            <p className="text-xs text-[#71717A]">
              지정한 날짜에 한진 프리미엄 지정배송으로 맞춰 도착합니다.
            </p>
          </div>
          <input
            type="date"
            min={minDateIso}
            max={maxDateIso}
            value={scheduledDate || minDateIso}
            onChange={(e) => onChangeScheduledDate(e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-white border border-[#D4D4D8] rounded-lg text-[#18181B]"
          />
        </div>
      )}
    </div>
  );
}
