import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * props:
 * - title: string
 * - value: string | number
 * - subtitle?: string
 * - trend?: number (prosent, f.eks. 4.2)
 * - icon?: React component (lucide)
 * - riskLevel?: "low" | "medium" | "high" | "neutral"
 * - goodWhenUp?: boolean (default: true)  <-- viktig for risk vs helse-score
 */
export default function RiskCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  riskLevel = "neutral",
  goodWhenUp = true,
}) {
  const bgColors = {
    low: "bg-emerald-50 border-emerald-100",
    medium: "bg-amber-50 border-amber-100",
    high: "bg-red-50 border-red-100",
    neutral: "bg-white border-slate-200",
  };

  // Subtil “Apple”-ikonboks: ikke gradient, bare lett tint
  const iconBg = {
    low: "bg-emerald-100/70 text-emerald-700",
    medium: "bg-amber-100/70 text-amber-800",
    high: "bg-red-100/70 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  // Trend-farge: tar hensyn til om “opp” er bra eller dårlig
  const trendIsPositive = trend > 0;
  const trendIsNegative = trend < 0;

  const isGood =
    trend === 0
      ? null
      : goodWhenUp
      ? trendIsPositive
      : trendIsNegative;

  const trendColor =
    isGood === null
      ? "text-slate-400"
      : isGood
      ? "text-emerald-700"
      : "text-red-600";

  const formatTrend = (n) => {
    if (typeof n !== "number" || Number.isNaN(n)) return "";
    const abs = Math.abs(n);
    return abs % 1 === 0 ? `${abs}%` : `${abs.toFixed(1)}%`;
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 transition-all",
        "hover:shadow-lg hover:shadow-slate-200/50",
        bgColors[riskLevel] || bgColors.neutral
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-slate-600">{title}</p>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>

            {typeof trend === "number" && (
              <div
                className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}
                aria-label={`Endring ${formatTrend(trend)}`}
              >
                <TrendIcon className="h-4 w-4" />
                <span>{formatTrend(trend)}</span>
              </div>
            )}
          </div>

          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>

        {Icon && (
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center",
              "shadow-sm border border-white/40",
              iconBg[riskLevel] || iconBg.neutral
            )}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
