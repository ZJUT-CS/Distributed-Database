import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  setPage,
  totalItems,
  itemsPerPage,
}) => {
  const [jumpPage, setJumpPage] = useState('');

  const handleJump = () => {
    const p = parseInt(jumpPage, 10);
    if (p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPage('');
    }
  };

  const resolvedTotalItems = Math.max(0, Number(totalItems) || 0);
  const startItem = resolvedTotalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = resolvedTotalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, resolvedTotalItems);

  return (
    <div className="mt-auto px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
      <div className="text-xs text-gray-500">
        显示 {startItem} 至 {endItem} 条，共 {resolvedTotalItems} 条
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 mr-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:border-transparent transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
              return (
                <button
                  key={i}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    currentPage === p
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                  }`}
                >
                  {p}
                </button>
              );
            } else if (p === currentPage - 2 || p === currentPage + 2) {
              return (
                <span key={i} className="flex items-end px-1 text-gray-400">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:border-transparent transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
          <span className="text-xs text-gray-400">跳至</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            className="w-10 h-8 rounded-lg border border-gray-200 text-center text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <span className="text-xs text-gray-400">页</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

