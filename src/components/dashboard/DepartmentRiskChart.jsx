import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function DepartmentRiskChart({ data = [], minRespondents = 5 }) {
  const sorted = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    return arr.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0)); // Høyest først
  }, [data]);

  const getBarColor = (score) => {
    if (score >= 4) return "#34D399"; // emerald-400
    if (score >= 3) return "#FBBF24"; // amber-400
    return "#F87171"; // red-400
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const row = payload[0]?.payload ?? {};
      const score = Number(row.score ?? payload[0].value ?? 0);
      const respondents = row.respondent_count;

      return (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-600 mt-1">
            Score: <span className="font-semibold">{score.toFixed(1)}</span> / 5
          </p>
          {typeof respondents === "number" && (
            <p className="text-xs text-slate-400 mt-0.5">{respondents} svar</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!sorted.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        Ingen avdelingsdata
      </div>
    );
  }

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis 
              type="number" 
              domain={[0, 5]} 
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#475569", fontSize: 13 }}
              width={100}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-500">God (4+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-500">Moderat (3-4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-slate-500">Lav (&lt;3)</span>
        </div>
      </div>
    </div>
  );
}