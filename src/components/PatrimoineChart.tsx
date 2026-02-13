"use client";
import { SimulationResult } from "@/lib/types";
import { fmtK } from "@/lib/formatters";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  result: SimulationResult;
  dureeCredit: number;
}

export default function PatrimoineChart({ result, dureeCredit }: Props) {
  // Échantillonner par année
  const data = result.monthly
    .filter((d) => d.month % 12 === 0)
    .map((d) => ({
      annee: d.year,
      achat: Math.round(d.patrimoineAchat),
      location: Math.round(d.patrimoineLocation),
    }));

  const crossYear = result.pointCroisement ? Math.ceil(result.pointCroisement / 12) : null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 mb-8">
      <h2 className="text-lg font-bold mb-4">📈 Évolution du patrimoine net</h2>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradAchat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLocation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="annee" stroke="#8585a0" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}a`} />
            <YAxis stroke="#8585a0" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtK(v)} />
            <Tooltip
              contentStyle={{ background: "#111119", border: "1px solid #1e1e2e", borderRadius: 12 }}
              formatter={(v: number | undefined) => fmtK(v ?? 0)}
              labelFormatter={(v) => `Année ${v}`}
            />
            <Area type="monotone" dataKey="achat" name="🏠 Achat" stroke="#7c5cfc" fill="url(#gradAchat)" strokeWidth={2} />
            <Area type="monotone" dataKey="location" name="📈 Location" stroke="#34d399" fill="url(#gradLocation)" strokeWidth={2} />
            <ReferenceLine x={dureeCredit} stroke="#fb923c" strokeDasharray="5 5" label={{ value: "Fin crédit", fill: "#fb923c", fontSize: 11 }} />
            {crossYear && (
              <ReferenceLine x={crossYear} stroke="#38bdf8" strokeDasharray="5 5" label={{ value: "Croisement", fill: "#38bdf8", fontSize: 11 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
