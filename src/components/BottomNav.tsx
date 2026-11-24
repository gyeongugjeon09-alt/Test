import { Home, Package, Search, Settings, ShoppingBag } from 'lucide-react';

export type ActiveTab = 'store' | 'search' | 'profile' | 'orders';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  cartCount: number;
  ordersCount: number;
  hasNewOrder?: boolean;
  onOpenCart: () => void;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  cartCount,
  ordersCount,
  hasNewOrder = false,
  onOpenCart,
}: BottomNavProps) {
  return (
    <nav
      aria-label="하단 기능 메뉴"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E4E7] h-16"
    >
      <div className="max-w-[960px] mx-auto h-full px-2 sm:px-6 grid grid-cols-5 items-center">
        <button
          type="button"
          onClick={() => onSelectTab('store')}
          className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'store'
              ? 'text-[#1D4ED8]'
              : 'text-[#52525B] hover:text-[#18181B]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>카테고리 · 홈</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'search'
              ? 'text-[#1D4ED8]'
              : 'text-[#52525B] hover:text-[#18181B]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>AI 검색 · 필터</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'text-[#1D4ED8]'
              : 'text-[#52525B] hover:text-[#18181B]'
          }`}
        >
          <div className="relative">
            <Package className="w-4 h-4" />
            {hasNewOrder && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#15803D]" />
            )}
          </div>
          <span>
            주문 내역
            {ordersCount > 0 ? ` (${ordersCount})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#52525B] hover:text-[#18181B] transition-colors cursor-pointer whitespace-nowrap"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#18181B] text-white text-[10px] font-mono tabular-nums flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>장바구니</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'text-[#1D4ED8]'
              : 'text-[#52525B] hover:text-[#18181B]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>설정 · 내 정보</span>
        </button>
      </div>
    </nav>
  );
}
