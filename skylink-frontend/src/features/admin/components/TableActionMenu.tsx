import React, { useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface TableActionMenuProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClose: () => void;
  children: React.ReactNode;
}

const TableActionMenu: React.FC<TableActionMenuProps> = ({ isOpen, onToggle, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-colors ${
          isOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          {children}
        </div>
      )}
    </div>
  );
};

export default TableActionMenu;

