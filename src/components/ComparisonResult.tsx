"use client";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";

interface Props {
  result: SimulationResult;
  horizonAns: number;
}

function Row({ label, achat, location, highlight }: { label: string; achat: string; location: string; highlight?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-4 py-3 ${highlight ? "font-bold text-lg" : "text-sm"} border-b border-[var(--border)]`}>
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-center">{achat}</span>
      <span className="text-center">{location}</span>
    </div>
  );
}

export default function ComparisonResult({ result, horizonAns }: Props) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 mb-8">
      <h2 className="text-lg font-bold mb-4">📊 Comparaison sur {horizonAns} ans</h2>

      <div className="grid grid-cols-3 gap-4 py-2 mb-2">
        <span></span>
        <span className="text-center font-semibold text-[var(--accent)]">🏠 Achat</span>
        <span className="text-center font-semibold text-[var(--green)]">📈 Location</span>
      </div>

      <Row label="Coût total" achat={fmt(result.coutTotalAchat)} location={fmt(result.coutTotalLocation)} />
      <Row label="Patrimoine net final" achat={fmt(result.patrimoineNetAchat)} location={fmt(result.patrimoineNetLocation)} highlight />

      <div className="grid grid-cols-3 gap-4 py-3 text-sm">
        <span className="text-[var(--muted)]">Différence</span>
        <span className="col-span-2 text-center font-bold text-[var(--orange)]">
          {fmt(Math.abs(result.patrimoineNetAchat - result.patrimoineNetLocation))} en faveur de {result.patrimoineNetAchat > result.patrimoineNetLocation ? "l'achat" : "la location"}
        </span>
      </div>

      {result.pointCroisement && (
        <p className="text-sm text-[var(--muted)] mt-2">
          📍 Point de croisement : après {Math.ceil(result.pointCroisement / 12)} ans ({result.pointCroisement} mois)
        </p>
      )}
    </div>
  );
}
