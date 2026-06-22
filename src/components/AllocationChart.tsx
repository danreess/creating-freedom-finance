"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface AllocationChartProps {
  coinspotTotal: number;
  ingTotal: number;
  pearlerTotal: number;
}

const COLORS = ["#f97316", "#60a5fa", "#a78bfa"];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1a2e] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-emerald-400">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function AllocationChart({
  coinspotTotal,
  ingTotal,
  pearlerTotal,
}: AllocationChartProps) {
  const data = [
    { name: "Crypto", value: coinspotTotal },
    { name: "Banking", value: ingTotal },
    { name: "Shares", value: pearlerTotal },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">No data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6">
      <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">
        Allocation
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-slate-400 text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
