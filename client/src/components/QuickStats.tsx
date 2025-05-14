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
    <div className="bg-white mb-6 border-4 border-primary shadow-md card-hover animate-in dark:bg-card dark:text-foreground overflow-hidden">
      {/* Retro header bar */}
      <div className="bg-primary text-white px-3 py-1 flex items-center justify-between border-b-2 border-black uppercase">
        <h2 className="font-bold text-sm tracking-wide flex items-center">
          <span className="material-icons text-base mr-1">query_stats</span>
          Today's Stats
        </h2>
        <div className="flex">
          <div className="w-3 h-3 bg-destructive border border-black mx-0.5"></div>
          <div className="w-3 h-3 bg-accent border border-black mx-0.5"></div>
          <div className="w-3 h-3 bg-secondary border border-black mx-0.5"></div>
        </div>
      </div>
      
      <div className="flex justify-between p-3 bg-dots">
        <div className="flex-1 border-2 border-primary mx-1 first:ml-0 last:mr-0 bg-white dark:bg-muted px-2 py-1" 
             style={{boxShadow: "2px 2px 0px black"}}>
          <p className="text-black text-xs font-bold mb-1 uppercase">Revenue</p>
          <p className="text-secondary font-mono font-bold text-lg"
             style={{textShadow: "1px 1px 0px rgba(0,0,0,0.2)"}}>
            +{formatNumber(stats.revenue)}
          </p>
        </div>
        
        <div className="flex-1 border-2 border-primary mx-1 bg-white dark:bg-muted px-2 py-1" 
             style={{boxShadow: "2px 2px 0px black"}}>
          <p className="text-black text-xs font-bold mb-1 uppercase">Expenses</p>
          <p className="text-destructive font-mono font-bold text-lg"
             style={{textShadow: "1px 1px 0px rgba(0,0,0,0.2)"}}>
            -{formatNumber(stats.expenses)}
          </p>
        </div>
        
        <div className="flex-1 border-2 border-primary mx-1 first:ml-0 last:mr-0 bg-white dark:bg-muted px-2 py-1" 
             style={{boxShadow: "2px 2px 0px black"}}>
          <p className="text-black text-xs font-bold mb-1 uppercase">Profit</p>
          <p className="text-primary font-mono font-bold text-lg"
             style={{textShadow: "1px 1px 0px rgba(0,0,0,0.2)"}}>
            {formatNumber(stats.profit)}
          </p>
        </div>
      </div>
      
      {/* Retro footer decoration */}
      <div className="h-2 w-full bg-secondary"></div>
    </div>
  );
}
