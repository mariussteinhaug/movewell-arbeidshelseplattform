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
  // Sorter: lav score øverst (mest viktig først)
  const sorted = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    return arr.sort((a, b) => (a?.score ?? 0) - (b?.score ?? 0));
  }, [data]);

  const getBarColor = (score) => {
    // Bruk samme terskler som du allerede har
    if (score >= 4) return "#10B981"; // emerald-500
    if (score >= 3) return "#F59E0B"; // amber-500
    return "#EF4444"; // red-500
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const row = payload[0]?.payload ?? {};
      const score = Number(row.score ?? payload[0].value ?? 0);
      const respondents = row.respondent_count;

      const riskLevel =
        score >= 4 ? "Lav risiko" : score >= 3 ? "Moderat risiko" : "Høy risiko";

      const visibilityHint =
        typeof respondents === "number" && respondents < minRespondents
          ? `Skjult pga. < ${minRespondents} respondenter`
          : null;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-xl">
          <p className="font-semibold text-slate-900">{label}</p>

          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-600">
              Helseindeks: <span className="font-semibold text-slate-900">{score.toFixed(1)}</span>
            </p>

            {typeof respondents === "number" && (
              <p className="text-xs text-slate-500">
                Respondenter: <span className="font-medium">{respondents}</span>
              </p>
            )}

            <p className="text-xs text-slate-500">{riskLevel}</p>

            {visibilityHint && (
              <p className="text-xs text-slate-500">{visibilityHint}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-slate-900">Helseindeks per avdeling</h3>
          <p className="text-sm text-slate-500 mt-1">Aggregert score basert på ukentlige kartlegginger</p>
        </div>
        <div className="py-10 text-center">
          <p className="text-slate-700 font-medium">Ingen data å vise ennå</p>
          <p className="text-sm text-slate-500 mt-1">Når ansatte har svart, vil grafen dukke opp her.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Helseindeks per avdeling</h3>
        <p className="text-sm text-slate-500 mt-1">
          Aggregert score basert på ukentlige kartlegginger
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 12 }} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#334155", fontSize: 13 }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={32}>
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-600">God (4–5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-600">Moderat (3–4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-600">Høy risiko (&lt; 3)</span>
        </div>
      </div>
    </div>
  );
}
