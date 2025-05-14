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
    <div className="bg-gradient-to-b from-card to-background dark:from-card dark:to-background rounded-xl shadow-md mb-6 p-5 border border-border/20 card-hover animate-in">
      <h2 className="text-foreground dark:text-foreground text-sm font-semibold mb-3 flex items-center">
        <span className="material-icons text-primary text-base mr-1">insights</span>
        Today's Summary
      </h2>
      <div className="flex justify-between">
        <div className="flex-1 px-3 py-2 bg-white dark:bg-muted bg-opacity-50 rounded-lg mx-1 first:ml-0 last:mr-0">
          <p className="text-muted-foreground text-xs font-medium mb-1">Revenue</p>
          <p className="text-secondary font-mono font-semibold text-lg">+{formatNumber(stats.revenue)}</p>
        </div>
        <div className="flex-1 px-3 py-2 bg-white dark:bg-muted bg-opacity-50 rounded-lg mx-1">
          <p className="text-muted-foreground text-xs font-medium mb-1">Expenses</p>
          <p className="text-destructive font-mono font-semibold text-lg">-{formatNumber(stats.expenses)}</p>
        </div>
        <div className="flex-1 px-3 py-2 bg-white dark:bg-muted bg-opacity-50 rounded-lg mx-1 first:ml-0 last:mr-0">
          <p className="text-muted-foreground text-xs font-medium mb-1">Profit</p>
          <p className="text-primary font-mono font-semibold text-lg">{formatNumber(stats.profit)}</p>
        </div>
      </div>
    </div>
  );
}
