"use client";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  result: SimulationResult;
}

const COLORS = ["#7c5cfc", "#38bdf8", "#34d399", "#fb923c", "#f472b6", "#a78bfa"];

export default function CostBreakdown({ result }: Props) {
  const data = [
    { name: "Mensualité crédit", value: Math.round(result.mensualiteCreditMensuel) },
    { name: "Taxe foncière", value: Math.round(result.taxeFonciereMensuel) },
    { name: "Charges copro", value: Math.round(result.chargesCoproMensuel) },
    { name: "Assurance PNO", value: Math.round(result.assurancePNOMensuel) },
    { name: "Entretien", value: Math.round(result.entretienMensuel) },
    { name: "Assurance emprunteur", value: Math.round(result.assuranceEmprunteurMensuel) },
  ];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 mb-8">
      <h2 className="text-lg font-bold mb-4">🏠 Répartition du coût mensuel d&apos;achat</h2>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                stroke="none" paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111119", border: "1px solid #1e1e2e", borderRadius: 12 }}
                formatter={(v: number | undefined) => fmt(v ?? 0) + "/mois"}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 text-sm">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
              <span className="text-[var(--muted)] flex-1">{item.name}</span>
              <span className="font-medium">{fmt(item.value)}/mois</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
