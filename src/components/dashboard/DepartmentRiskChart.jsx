import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DepartmentRiskChart({ data }) {
  const getBarColor = (score) => {
    if (score >= 4) return '#10B981';
    if (score >= 3) return '#F59E0B';
    return '#EF4444';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const riskLevel = score >= 4 ? 'Lav risiko' : score >= 3 ? 'Moderat risiko' : 'Høy risiko';
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-sm text-slate-600 mt-1">
            Helseindeks: <span className="font-medium">{score.toFixed(1)}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{riskLevel}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Helseindeks per avdeling</h3>
        <p className="text-sm text-slate-500 mt-1">Aggregert score basert på ukentlige kartlegginger</p>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" domain={[0, 5]} tick={{ fill: '#64748B', fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 13 }} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-600">God (4-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-600">Moderat (3-4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-600">Høy risiko (&lt;3)</span>
        </div>
      </div>
    </div>
  );
}