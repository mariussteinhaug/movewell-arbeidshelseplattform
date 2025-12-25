import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function RiskCard({ title, value, subtitle, trend, icon: Icon, riskLevel }) {
  const riskColors = {
    low: 'from-emerald-500 to-teal-500',
    medium: 'from-amber-500 to-orange-500',
    high: 'from-red-500 to-rose-500',
    neutral: 'from-slate-400 to-slate-500'
  };

  const bgColors = {
    low: 'bg-emerald-50 border-emerald-100',
    medium: 'bg-amber-50 border-amber-100',
    high: 'bg-red-50 border-red-100',
    neutral: 'bg-slate-50 border-slate-100'
  };

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400';

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50",
      bgColors[riskLevel] || bgColors.neutral
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
                <TrendIcon className="h-4 w-4" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            riskColors[riskLevel] || riskColors.neutral
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}