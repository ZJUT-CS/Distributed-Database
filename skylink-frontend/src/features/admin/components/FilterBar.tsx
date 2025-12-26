import React from 'react';

export type FilterBarProps = {
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

const FilterBar: React.FC<FilterBarProps> = ({ left, right, className }) => {
  return (
    <div
      className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between ${
        className ?? ''
      }`.trim()}
    >
      <div className="flex-1 w-full">{left}</div>
      {right ? <div className="w-full md:w-auto">{right}</div> : null}
    </div>
  );
};

export default FilterBar;

