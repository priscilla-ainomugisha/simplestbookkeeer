import React from 'react';

type QuickStatsProps = {
  stats: {
    revenue: number;
    expenses: number;
    profit: number;
  };
};

export default function QuickStats({ stats }: QuickStatsProps) {
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow mb-6 p-4">
      <h2 className="text-neutral-700 dark:text-neutral-300 text-sm font-medium mb-3">Today's Summary</h2>
      <div className="flex justify-between">
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Revenue</p>
          <p className="text-secondary font-mono font-medium">+{formatNumber(stats.revenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Expenses</p>
          <p className="text-error font-mono font-medium">-{formatNumber(stats.expenses)}</p>
        </div>
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Profit</p>
          <p className="text-primary font-mono font-medium">{formatNumber(stats.profit)}</p>
        </div>
      </div>
    </div>
  );
}
