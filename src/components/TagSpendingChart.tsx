import React, { useState, useMemo } from 'react';
import { PieChart, BarChart2, X, Users, Tag as TagIcon } from 'lucide-react';
import type { Expense, QuickTag, Member, AppTheme } from '../types';

interface TagSpendingChartProps {
  expenses: Expense[];
  tags: QuickTag[];
  members?: Member[];
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
  members = [],
  theme,
  selectedTagFilter,
  onSelectTagFilter,
}) => {
  const [breakdownType, setBreakdownType] = useState<'TAG' | 'MEMBER'>('TAG');
  const [viewMode, setViewMode] = useState<'DONUT' | 'BAR'>('DONUT');
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const isPurple = theme === 'purple';

  // Total spent across all expenses
  const totalSpend = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  }, [expenses]);

  // Aggregate spending by tag
  const sortedCategories = useMemo(() => {
    if (expenses.length === 0 || totalSpend === 0) return [];

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

    return Object.entries(tagTotals)
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
  }, [expenses, tags, totalSpend]);

  // Aggregate spending by flatmate (K6)
  const memberBreakdowns = useMemo(() => {
    if (members.length === 0 || totalSpend === 0) return [];

    return members.map((m) => {
      // Total paid by this member
      const paidTotal = expenses
        .filter((e) => e.paidById === m.id)
        .reduce((sum, e) => sum + e.totalAmount, 0);

      // Total consumed / share owed by this member
      const consumedTotal = expenses.reduce((sum, e) => {
        const split = e.splits.find((s) => s.memberId === m.id);
        return sum + (split ? split.amount : 0);
      }, 0);

      const net = paidTotal - consumedTotal;
      const consumedPct = (consumedTotal / totalSpend) * 100;
      const paidPct = (paidTotal / totalSpend) * 100;

      return {
        member: m,
        paidTotal,
        consumedTotal,
        net,
        consumedPct,
        paidPct,
      };
    }).sort((a, b) => b.consumedTotal - a.consumedTotal);
  }, [expenses, members, totalSpend]);

  // SVG Donut Calculations
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Pre-calculate segment offsets purely to avoid mutation during render
  const categoriesWithOffsets = useMemo(() => {
    return sortedCategories.map((cat, idx, arr) => {
      const strokeDash = (cat.percentage / 100) * circumference;
      const currentOffset = arr
        .slice(0, idx)
        .reduce((sum, c) => sum + (c.percentage / 100) * circumference, 0);
      return {
        ...cat,
        strokeDash,
        currentOffset,
      };
    });
  }, [sortedCategories, circumference]);

  if (expenses.length === 0 || totalSpend === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/5 text-center text-zinc-500 text-xs">
        No spending data to visualize yet. Add an expense above to see category & flatmate breakdowns.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
            <span>📊 Spending Insights</span>
            <span className="text-xs font-normal text-zinc-500 font-sans">
              (₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
            </span>
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {breakdownType === 'TAG' ? 'Categorical distribution of all expenses' : 'Individual contribution vs consumption'}
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2">
          {/* Breakdown Mode: Category vs Flatmate */}
          {members.length > 0 && (
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setBreakdownType('TAG')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  breakdownType === 'TAG'
                    ? isPurple
                      ? 'bg-purple-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TagIcon className="w-3 h-3" />
                <span>Categories</span>
              </button>
              <button
                type="button"
                onClick={() => setBreakdownType('MEMBER')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  breakdownType === 'MEMBER'
                    ? isPurple
                      ? 'bg-purple-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Per Flatmate</span>
              </button>
            </div>
          )}

          {/* Sub-view switcher for Tag mode: Donut vs Bar */}
          {breakdownType === 'TAG' && (
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('DONUT')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'DONUT'
                    ? isPurple
                      ? 'bg-purple-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Donut Chart View"
              >
                <PieChart className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('BAR')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'BAR'
                    ? isPurple
                      ? 'bg-purple-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Bar Chart View"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Pill Alert */}
      {selectedTagFilter && breakdownType === 'TAG' && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/90 border border-white/10 text-xs">
          <span className="text-zinc-300">
            Filtering by tag: <strong className="text-white">{selectedTagFilter}</strong>
          </span>
          <button
            onClick={() => onSelectTagFilter && onSelectTagFilter(null)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Main Breakdown Content */}
      {breakdownType === 'TAG' ? (
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
                  {categoriesWithOffsets.map((cat) => {
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
                        strokeDasharray={`${cat.strokeDash} ${circumference - cat.strokeDash}`}
                        strokeDashoffset={-cat.currentOffset}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredTag(cat.name)}
                        onMouseLeave={() => setHoveredTag(null)}
                        onClick={() =>
                          onSelectTagFilter &&
                          onSelectTagFilter(selectedTagFilter === cat.name ? null : cat.name)
                        }
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
                  onClick={() =>
                    onSelectTagFilter &&
                    onSelectTagFilter(selectedTagFilter === cat.name ? null : cat.name)
                  }
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
                    <span className="font-mono text-zinc-300">
                      ₹{cat.total.toLocaleString('en-IN')} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
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

          {/* Category List & Chips */}
          <div className="md:col-span-7 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {sortedCategories.map((cat) => {
                const isSelected = selectedTagFilter === cat.name;
                return (
                  <div
                    key={cat.name}
                    onClick={() =>
                      onSelectTagFilter &&
                      onSelectTagFilter(isSelected ? null : cat.name)
                    }
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? isPurple
                          ? 'bg-purple-950/50 border-purple-600 shadow-md'
                          : 'bg-rose-950/50 border-rose-600 shadow-md'
                        : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {cat.count} expense{cat.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-zinc-200">
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
          </div>
        </div>
      ) : (
        /* PER FLATMATE BREAKDOWN VIEW (K6) */
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memberBreakdowns.map((mb) => {
              const isCreditor = mb.net > 0.01;
              const isDebtor = mb.net < -0.01;

              return (
                <div
                  key={mb.member.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2.5"
                >
                  {/* Header: Member Avatar + Name + Net Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                        style={{ backgroundColor: mb.member.avatarColor }}
                      >
                        {mb.member.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white text-xs">{mb.member.name}</span>
                    </div>

                    {/* Net Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        isCreditor
                          ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                          : isDebtor
                          ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {isCreditor
                        ? `+₹${mb.net.toFixed(2)} owed`
                        : isDebtor
                        ? `-₹${Math.abs(mb.net).toFixed(2)} owes`
                        : 'Settled ₹0'}
                    </span>
                  </div>

                  {/* Numbers Grid: Paid vs Consumed */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                      <div className="text-[10px] text-zinc-500 font-mono">Paid Out-of-Pocket</div>
                      <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                        ₹{mb.paidTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                      <div className="text-[10px] text-zinc-500 font-mono">Their Fair Share</div>
                      <div className="font-mono font-bold text-rose-400 text-xs mt-0.5">
                        ₹{mb.consumedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar of their share */}
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                      <span>Consumed {mb.consumedPct.toFixed(1)}% of total</span>
                      <span>Paid {mb.paidPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(100, mb.paidPct)}%` }}
                        title={`Paid ${mb.paidPct.toFixed(1)}%`}
                      />
                      <div
                        className="bg-rose-500 h-full opacity-60"
                        style={{ width: `${Math.min(100, mb.consumedPct)}%` }}
                        title={`Consumed ${mb.consumedPct.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
