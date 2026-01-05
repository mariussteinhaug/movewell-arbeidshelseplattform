import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, User as UserIcon, Building2, AlertTriangle } from "lucide-react";
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

export default function CaseDetail({ item }) {
  if (!item) return null;
  const dateStr = item?.created_at
    ? format(new Date(item.created_at), "dd. MMM yyyy", { locale: nb })
    : "";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {item.accommodation_type || "Tilrettelegging"}
          </h2>
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
            {item.risk_level && (
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {item.risk_level}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" /> {dateStr}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {item.employee_display_name && (
          <div className="flex items-center gap-2 text-slate-700">
            <UserIcon className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Ansatt:</span>
            <span>{item.employee_display_name}</span>
          </div>
        )}
        {item.department_name && (
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Avdeling:</span>
            <span>{item.department_name}</span>
          </div>
        )}
      </div>

      {item.description && (
        <div>
          <p className="text-sm font-medium text-slate-900 mb-1">Beskrivelse</p>
          <div className="text-sm text-slate-800 whitespace-pre-wrap bg-white border border-slate-200 rounded-2xl p-4">
            {item.description}
          </div>
        </div>
      )}

      {item.notes && (
        <div>
          <p className="text-sm font-medium text-slate-900 mb-1">Notat</p>
          <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-2xl p-4">
            {item.notes}
          </div>
        </div>
      )}
    </div>
  );
}