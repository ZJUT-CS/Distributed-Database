import React from 'react';

export type FilterBarProps = {
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

const FilterBar: React.FC<FilterBarProps> = ({ left, right, className }) => {
  return (
    <div
      className={`bg-admin-surface p-4 rounded-admin border border-admin-border shadow-admin flex flex-col md:flex-row gap-4 items-center justify-between ${
        className ?? ''
      }`.trim()}
    >
      <div className="flex-1 w-full">{left}</div>
      {right ? <div className="w-full md:w-auto">{right}</div> : null}
    </div>
  );
};

export default FilterBar;

