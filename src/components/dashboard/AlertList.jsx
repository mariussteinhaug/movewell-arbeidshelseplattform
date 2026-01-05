import React from "react";
import { AlertTriangle, TrendingDown, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { cn } from "@/lib/utils";

export default function AlertList({ alerts }) {
  const priorityStyles = {
    høy: {
      row: "bg-red-50 border-red-200",
      chip: "bg-red-100 text-red-700",
      icon: "text-red-700",
    },
    middels: {
      row: "bg-amber-50 border-amber-200",
      chip: "bg-amber-100 text-amber-800",
      icon: "text-amber-800",
    },
    lav: {
      row: "bg-blue-50 border-blue-200",
      chip: "bg-blue-100 text-blue-700",
      icon: "text-blue-700",
    },
  };

  const iconMap = {
    fysisk: AlertTriangle,
    mental: TrendingDown,
    arbeidsforhold: Users,
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Varsler</h3>
        <div className="text-center py-8">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-slate-700 font-medium">Ingen aktive varsler</p>
          <p className="text-sm text-slate-500 mt-1">Alt ser bra ut!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Varsler</h3>
        <Link
          to={createPageUrl("AssessmentResults")}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          Se alle
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {alerts.slice(0, 4).map((alert, index) => {
          const Icon = iconMap[alert.category] || AlertTriangle;
          const styles = priorityStyles[alert.priority] || priorityStyles.middels;

          // Hvis du senere får en konkret ID på anbefaling/tiltak,
          // kan du linke direkte til detail-siden her.
          const rowLink = createPageUrl("AssessmentResults");

          return (
            <Link
              key={index}
              to={rowLink}
              className={cn(
                "block rounded-xl border p-4 transition",
                styles.row,
                "hover:brightness-[0.98] active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              )}
              aria-label={`Åpne anbefalinger for varsel: ${alert.title}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", styles.icon)} />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{alert.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{alert.department}</p>
                </div>

                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                    styles.chip
                  )}
                >
                  {alert.priority}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}