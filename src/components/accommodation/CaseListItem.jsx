import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Archive } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

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
      className={
        "w-full text-left p-3 rounded-lg border transition " +
        (selected
          ? "border-emerald-500 bg-emerald-50"
          : "border-slate-200 bg-white hover:bg-slate-50")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {item.archived && (
            <Archive className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          )}
          <p className="font-medium text-slate-900 truncate">
            {item.accommodation_type || "Tilrettelegging"}
          </p>
        </div>
        <p className="font-medium text-slate-900 truncate">
          {item.accommodation_type || "Tilrettelegging"}
        </p>
        <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" /> {dateStr}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {item.status && (
          <Badge className={statusColors[item.status] || "bg-slate-100 text-slate-800"}>
            {item.status}
          </Badge>
        )}
        {item.priority && (
          <Badge className={priorityColors[item.priority] || "bg-slate-100 text-slate-800"}>
            {item.priority}
          </Badge>
        )}
        {item.employee_display_name && (
          <span className="text-xs text-slate-600 truncate">
            {item.employee_display_name}
          </span>
        )}
      </div>
    </button>
  );
}