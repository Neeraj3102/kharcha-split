import React, { useState } from 'react';
import { PieChart, BarChart2, X } from 'lucide-react';
import type { Expense, QuickTag, AppTheme } from '../types';

interface TagSpendingChartProps {
  expenses: Expense[];
  tags: QuickTag[];
  theme: AppTheme;
  selectedTagFilter?: string | null;
  onSelectTagFilter?: (tag: string | null) => void;
}

const TAG_PALETTE = [
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#14b8a6', // teal
  '#a855f7', // purple
  '#f97316', // orange
  '#64748b', // slate
];

export const TagSpendingChart: React.FC<TagSpendingChartProps> = ({
  expenses,
  tags,
  theme,
  selectedTagFilter,
  onSelectTagFilter,
}) => {
  const [viewMode, setViewMode] = useState<'DONUT' | 'BAR'>('DONUT');
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const isBumblebee = theme === 'bumblebee';

  // Total spent across all expenses
  const totalSpend = expenses.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  if (expenses.length === 0 || totalSpend === 0) {
    return null;
  }

  // Aggregate spending by tag
  const tagTotals: Record<string, { total: number; count: number; icon: string }> = {};

  expenses.forEach((exp) => {
    const tagName = exp.tag || 'General';
    if (!tagTotals[tagName]) {
      const matchedTag = tags.find((t) => t.label === tagName);
      tagTotals[tagName] = {
        total: 0,
        count: 0,
        icon: matchedTag?.icon || '🏷️',
      };
    }
    tagTotals[tagName].total += Number(exp.totalAmount) || 0;
    tagTotals[tagName].count += 1;
  });

  // Convert to sorted array
  const sortedCategories = Object.entries(tagTotals)
    .map(([name, data], idx) => {
      const percentage = (data.total / totalSpend) * 100;
      return {
        name,
        total: data.total,
        count: data.count,
        icon: data.icon,
        percentage,
        color: TAG_PALETTE[idx % TAG_PALETTE.length],
      };
    })
    .sort((a, b) => b.total - a.total);

  // SVG Donut Calculations
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-lg ${
              isBumblebee ? 'bg-yellow-400/10 text-yellow-400' : 'bg-rose-500/10 text-rose-500'
            }`}
          >
            <PieChart className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-heading">
              Spending by Category / Tag
            </h3>
            <p className="text-[11px] text-zinc-500">
              Visual breakdown of where your group's money was spent
            </p>
          </div>
        </div>

        {/* View mode toggle + Clear filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedTagFilter && onSelectTagFilter && (
            <button
              onClick={() => onSelectTagFilter(null)}
              className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1 cursor-pointer hover:bg-rose-900"
            >
              <span>Filter: {selectedTagFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('DONUT')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition cursor-pointer ${
                viewMode === 'DONUT'
                  ? isBumblebee
                    ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                    : 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Pie</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('BAR')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition cursor-pointer ${
                viewMode === 'BAR'
                  ? isBumblebee
                    ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                    : 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* DONUT PIE CHART VIEW */}
        {viewMode === 'DONUT' ? (
          <div className="md:col-span-5 flex flex-col items-center justify-center p-2 relative">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#1e1e24"
                  strokeWidth={strokeWidth}
                />
                {/* Segment Arcs */}
                {sortedCategories.map((cat) => {
                  const strokeDash = (cat.percentage / 100) * circumference;
                  const currentOffset = accumulatedOffset;
                  accumulatedOffset += strokeDash;
                  const isHovered = hoveredTag === cat.name;

                  return (
                    <circle
                      key={cat.name}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                      strokeDashoffset={-currentOffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredTag(cat.name)}
                      onMouseLeave={() => setHoveredTag(null)}
                      onClick={() => onSelectTagFilter && onSelectTagFilter(selectedTagFilter === cat.name ? null : cat.name)}
                    />
                  );
                })}
              </svg>

              {/* Center Total Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  {hoveredTag ? hoveredTag : 'Total Spend'}
                </span>
                <span className="text-base font-extrabold text-white font-mono">
                  ₹{
                    hoveredTag
                      ? sortedCategories.find((c) => c.name === hoveredTag)?.total.toLocaleString('en-IN')
                      : totalSpend.toLocaleString('en-IN')
                  }
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {hoveredTag
                    ? `${sortedCategories.find((c) => c.name === hoveredTag)?.percentage.toFixed(1)}%`
                    : `${sortedCategories.length} Categories`}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 mt-2 text-center">
              💡 Tap any slice to filter the expenses list
            </div>
          </div>
        ) : (
          /* HORIZONTAL BAR VIEW */
          <div className="md:col-span-5 space-y-3 p-1">
            {sortedCategories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => onSelectTagFilter && onSelectTagFilter(selectedTagFilter === cat.name ? null : cat.name)}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  selectedTagFilter === cat.name
                    ? 'bg-zinc-800/90 border-rose-500/80 shadow-md'
                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400 text-[11px]">
                      ₹{cat.total.toLocaleString('en-IN')}
                    </span>
                    <span className="font-mono font-bold text-white text-[11px] w-12 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORY LEGEND & BREAKDOWN TABLE */}
        <div className="md:col-span-7 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {sortedCategories.map((cat) => {
              const isSelected = selectedTagFilter === cat.name;
              return (
                <div
                  key={cat.name}
                  onClick={() => onSelectTagFilter && onSelectTagFilter(isSelected ? null : cat.name)}
                  onMouseEnter={() => setHoveredTag(cat.name)}
                  onMouseLeave={() => setHoveredTag(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-600 shadow-md'
                      : hoveredTag === cat.name
                      ? 'bg-zinc-800 border-white/20'
                      : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="leading-tight">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {cat.count} {cat.count === 1 ? 'bill' : 'bills'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">
                      ₹{cat.total.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTagFilter && (
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-between text-xs text-zinc-300">
              <span>
                Filtering feed by: <strong>{selectedTagFilter}</strong>
              </span>
              <button
                onClick={() => onSelectTagFilter && onSelectTagFilter(null)}
                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
