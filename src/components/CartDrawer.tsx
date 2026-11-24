import { useState } from 'react';
import { MapPin, Minus, Plus, Trash2, Truck, X } from 'lucide-react';
import {
  DELIVERY_SPEED_OPTIONS,
  formatKrw,
  formatShippingFee,
  getDeliverySpeedLabel,
} from '../shared/catalog.ts';
import type { DeliverySpeed, Product } from '../shared/types.ts';
import { ProductImage } from './ProductImage.tsx';
import { StarRating } from './StarRating.tsx';

export interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
  deliveryAddress: string;
  deliverySpeed: DeliverySpeed;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  defaultAddress: string;
  onToggleItem: (productId: string) => void;
  onToggleAll: (selected: boolean) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onUpdateItemDelivery: (
    productId: string,
    patch: { deliveryAddress?: string; deliverySpeed?: DeliverySpeed }
  ) => void;
  onRemoveItem: (productId: string) => void;
  onRemoveSelected: () => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  defaultAddress,
  onToggleItem,
  onToggleAll,
  onUpdateQuantity,
  onUpdateItemDelivery,
  onRemoveItem,
  onRemoveSelected,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [editingAddressProductId, setEditingAddressProductId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedItems = items.filter((item) => item.selected);
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const splitGroupCount = new Set(
    selectedItems.map(
      (item) =>
        `${(item.deliveryAddress || defaultAddress).trim()}__||__${item.deliverySpeed}`
    )
  ).size;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="장바구니">
      <div className="fixed inset-0 bg-black/35 transition-opacity" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-[#E4E4E7] shadow-xl">
        <div className="px-6 py-5 border-b border-[#E4E4E7] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#18181B]">장바구니</h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              상품별 배송지·배송 방식을 고르고 체크한 상품만 주문하세요
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="장바구니 닫기"
            className="p-2 text-[#52525B] hover:text-[#18181B] rounded-lg hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-6 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
            <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#18181B] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="장바구니 상품 전체 선택"
                className="w-4 h-4 rounded border-[#D4D4D8] accent-[#18181B] cursor-pointer"
              />
              <span>
                전체 선택 ({selectedItems.length}/{items.length})
              </span>
            </label>
            <button
              type="button"
              onClick={onRemoveSelected}
              disabled={selectedItems.length === 0}
              className="text-xs font-medium text-[#71717A] hover:text-[#DC2626] disabled:text-[#D4D4D8] disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              선택 삭제
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-[#52525B]">장바구니가 비어 있습니다.</p>
              <p className="text-xs text-[#71717A] mt-1">
                스토어나 AI 맞춤 검색에서 상품을 담아 주문을 시작해 보세요.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#E4E4E7]">
              {items.map(({ product, quantity, selected, deliveryAddress, deliverySpeed }) => {
                const resolvedAddress = (deliveryAddress || defaultAddress).trim();
                const isCustomAddress =
                  defaultAddress.trim() !== '' && resolvedAddress !== defaultAddress.trim();
                const isEditingAddress = editingAddressProductId === product.id;

                return (
                  <li
                    key={product.id}
                    className={`py-4 flex gap-3 transition-opacity ${selected ? '' : 'opacity-60'}`}
                  >
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleItem(product.id)}
                        aria-label={`${product.name} 주문 선택`}
                        className="w-4 h-4 rounded border-[#D4D4D8] accent-[#18181B] cursor-pointer"
                      />
                    </div>
                    <div
                      onClick={() => onToggleItem(product.id)}
                      className="w-20 aspect-[4/3] bg-[#F4F4F5] rounded-lg overflow-hidden shrink-0 cursor-pointer self-start"
                    >
                      <ProductImage src={product.image} alt={product.name} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-[#71717A] truncate">
                            {product.brand} · {product.sellerName}
                          </p>
                          <h3
                            onClick={() => onToggleItem(product.id)}
                            className="text-sm font-medium text-[#18181B] truncate cursor-pointer"
                          >
                            {product.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`${product.name} 삭제`}
                          className="p-1 text-[#71717A] hover:text-[#DC2626] transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating compact rating={product.attributes.sellerRating} />
                        <span aria-hidden="true" className="text-xs text-[#D4D4D8]">·</span>
                        <span
                          className={`text-xs font-medium ${
                            product.attributes.shippingFee === 0
                              ? 'text-[#15803D]'
                              : 'text-[#52525B]'
                          }`}
                        >
                          {formatShippingFee(product.attributes.shippingFee)}
                        </span>
                      </div>

                      {/* Per-Item Delivery Method & Address Settings */}
                      <div className="mt-2.5 p-2.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`cart-speed-${product.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525B] shrink-0"
                          >
                            <Truck className="w-3 h-3" />
                            <span>배송 방식</span>
                          </label>
                          <select
                            id={`cart-speed-${product.id}`}
                            value={deliverySpeed}
                            onChange={(e) =>
                              onUpdateItemDelivery(product.id, {
                                deliverySpeed: e.target.value as DeliverySpeed,
                              })
                            }
                            className="max-w-[175px] px-2 py-1 text-[11px] font-medium text-[#18181B] bg-white border border-[#D4D4D8] rounded cursor-pointer"
                          >
                            {product.supportedDeliveries.map((speed) => {
                              const meta = DELIVERY_SPEED_OPTIONS.find((opt) => opt.id === speed);
                              return (
                                <option key={speed} value={speed}>
                                  {getDeliverySpeedLabel(speed)} ({meta?.extraFeeLabel ?? ''})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1 text-[11px] text-[#52525B] min-w-0">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-[#71717A]" />
                              <span className="truncate" title={resolvedAddress}>
                                {isCustomAddress ? (
                                  <span className="text-[#1D4ED8] font-medium">
                                    [개별] {resolvedAddress}
                                  </span>
                                ) : (
                                  <span>[기본] {resolvedAddress}</span>
                                )}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingAddressProductId(isEditingAddress ? null : product.id)
                              }
                              className="text-[11px] font-medium text-[#1D4ED8] hover:underline shrink-0 cursor-pointer"
                            >
                              {isEditingAddress ? '완료' : '배송지 변경'}
                            </button>
                          </div>

                          {isEditingAddress && (
                            <div className="space-y-1.5 pt-1">
                              <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) =>
                                  onUpdateItemDelivery(product.id, {
                                    deliveryAddress: e.target.value,
                                  })
                                }
                                placeholder="배송받을 주소를 입력하세요"
                                className="w-full px-2.5 py-1.5 text-[11px] text-[#18181B] bg-white border border-[#D4D4D8] rounded"
                              />
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateItemDelivery(product.id, {
                                      deliveryAddress: defaultAddress,
                                    })
                                  }
                                  className="px-2 py-1 text-[10px] font-medium bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded text-[#18181B] cursor-pointer"
                                >
                                  기본 배송지
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateItemDelivery(product.id, {
                                      deliveryAddress: '서울특별시 강남구 테헤란로 212, 오피스 9층',
                                    })
                                  }
                                  className="px-2 py-1 text-[10px] font-medium bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded text-[#18181B] cursor-pointer"
                                >
                                  직장 배송지
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#E4E4E7] rounded-md">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, -1)}
                            aria-label="수량 감소"
                            className="p-1.5 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono tabular-nums text-[#18181B]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, 1)}
                            aria-label="수량 증가"
                            className="p-1.5 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[#18181B]">
                          {formatKrw(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-5 border-t border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-[#52525B]">
              선택 상품 주문 금액 ({selectedItems.length}종 · {selectedQuantity}개)
            </span>
            <span className="text-lg font-semibold tabular-nums text-[#18181B]">
              {formatKrw(selectedSubtotal)}
            </span>
          </div>
          {items.length > 0 && selectedItems.length === 0 && (
            <p className="text-xs text-[#DC2626] mb-3">
              주문할 상품을 1개 이상 체크해 주세요.
            </p>
          )}
          {splitGroupCount > 1 && (
            <p className="text-xs text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 mb-3">
              배송지 또는 배송 방식이 서로 다른 {splitGroupCount}개 그룹이 섞여 있습니다. 결제 진행 시 분리 주문 안내 창이 표시됩니다.
            </p>
          )}
          {!(items.length > 0 && selectedItems.length === 0) && splitGroupCount <= 1 && (
            <div className="mb-3" />
          )}
          <button
            type="button"
            disabled={selectedItems.length === 0}
            onClick={onProceedToCheckout}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#D4D4D8] disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          >
            {selectedItems.length > 0
              ? splitGroupCount > 1
                ? `선택한 ${selectedItems.length}개 상품 (${splitGroupCount}건 분리 확인 후 주문)`
                : `선택한 ${selectedItems.length}개 상품 주문하기`
              : '주문할 상품을 선택해 주세요'}
          </button>
        </div>
      </div>
    </div>
  );
}
