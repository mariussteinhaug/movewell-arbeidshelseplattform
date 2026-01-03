import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function TrendChart({ data = [] }) {
  const sorted = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];

    // Sorter etter uke hvis "week" er f.eks. "01", "02" eller 1,2 osv.
    // Hvis du senere bruker "YYYY-WW", oppdater sorteringen til å parse det.
    return arr.sort((a, b) => {
      const wa = Number(a?.week ?? 0);
      const wb = Number(b?.week ?? 0);
      return wa - wb;
    });
  }, [data]);

  const fmt = (v) => (typeof v === "number" && !Number.isNaN(v) ? v.toFixed(1) : "—");

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-xl">
          <p className="font-semibold text-slate-900 mb-2">Uke {label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600">{entry.name}:</span>
                <span className="font-semibold text-slate-900">{fmt(entry.value)}</span>
              </div>
            ))}
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
          <h3 className="text-lg font-semibold text-slate-900">Utvikling over tid</h3>
          <p className="text-sm text-slate-500 mt-1">Gjennomsnittlig score per kategori siste 8 uker</p>
        </div>
        <div className="py-10 text-center">
          <p className="text-slate-700 font-medium">Ingen trenddata ennå</p>
          <p className="text-sm text-slate-500 mt-1">Når flere uker er registrert, vises utviklingen her.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Utvikling over tid</h3>
        <p className="text-sm text-slate-500 mt-1">Gjennomsnittlig score per kategori siste 8 uker</p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sorted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 12 }} />
            <YAxis domain={[1, 5]} tick={{ fill: "#64748B", fontSize: 12 }} />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: "14px" }}
              iconType="circle"
              iconSize={8}
            />

            <Line
              type="monotone"
              dataKey="fysisk"
              name="Fysisk"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ fill: "#10B981", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="mental"
              name="Mental"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: "#3B82F6", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="arbeid"
              name="Arbeidsforhold"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={{ fill: "#8B5CF6", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
