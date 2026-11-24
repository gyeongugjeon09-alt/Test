import { Search } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSubmitSearch: () => void;
  onGoHome: () => void;
}

export function Header({
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
  onGoHome,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-[#E4E4E7]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <button
          type="button"
          onClick={onGoHome}
          className="text-lg font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
        >
          SUNBYEOL
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitSearch();
          }}
          className="flex-1 max-w-2xl flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="찾을 상품 검색 (상품명, 카테고리, 브랜드 등)"
              aria-label="상품 검색"
              className="w-full pl-10 pr-3.5 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus-visible:ring-[#1D4ED8] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            검색
          </button>
        </form>
      </div>
    </header>
  );
}
