import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Archive, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusColors = {
  planlagt: "bg-amber-100 text-amber-800",
  pagaende: "bg-blue-100 text-blue-800",
  fullfort: "bg-emerald-100 text-emerald-800",
};

const priorityColors = {
  lav: "bg-slate-100 text-slate-800",
  normal: "bg-indigo-100 text-indigo-800",
  hoy: "bg-red-100 text-red-800",
};

export default function CaseListItem({ item, selected, onClick }) {
  const dateStr = item?.created_at
    ? format(new Date(item.created_at), "dd. MMM yyyy", { locale: nb })
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left p-4 rounded-lg border transition-all duration-200 relative",
        selected
          ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {item.archived && (
              <Archive className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            )}
            <p className={cn(
              "font-medium truncate transition-colors",
              selected ? "text-emerald-900" : "text-slate-900 group-hover:text-emerald-700"
            )}>
              {item.accommodation_type || "Tilrettelegging"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> {dateStr}
            </span>
            {item.employee_display_name && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="truncate max-w-[150px]">
                  {item.employee_display_name}
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronRight className={cn(
          "h-5 w-5 text-slate-300 transition-transform duration-200 absolute right-3 top-1/2 -translate-y-1/2",
          selected ? "text-emerald-500 opacity-100 translate-x-1" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        )} />
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap pr-4">
        {item.status && (
          <Badge variant="secondary" className={cn("font-normal border-0", statusColors[item.status])}>
            {item.status}
          </Badge>
        )}
        {item.priority && (
          <Badge variant="outline" className={cn("font-normal bg-white", priorityColors[item.priority])}>
            {item.priority}
          </Badge>
        )}
      </div>
    </button>
  );
}