"use client";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";

interface Props {
  result: SimulationResult;
  prixBien: number;
}

export default function DetailTable({ result, prixBien }: Props) {
  const rows = [
    { label: "Prix du bien", achat: fmt(prixBien), location: "—" },
    { label: "Frais de notaire", achat: fmt(result.fraisNotaire), location: "—" },
    { label: "Coût total crédit", achat: fmt(result.coutTotalCredit), location: "—" },
    { label: "Taxes & charges cumulées", achat: fmt(result.taxesChargesCumulees), location: "—" },
    { label: "Valeur finale du bien", achat: fmt(result.monthly[result.monthly.length - 1].valeurBien), location: "—" },
    { label: "Loyers cumulés", achat: "—", location: fmt(result.loyersCumules) },
    { label: "Capital investi total", achat: "—", location: fmt(result.monthly[result.monthly.length - 1].capitalPlace) },
    { label: "Patrimoine brut final", achat: fmt(result.patrimoineNetAchat), location: fmt(result.patrimoineNetLocation) },
    { label: "Fiscalité à la revente", achat: fmt(result.taxCalculation.plusValueImmobiliere.impotTotal), location: fmt(result.taxCalculation.flatTaxInvestissement.taxeTotal), fiscal: true },
    { label: "Patrimoine net après fiscalité", achat: fmt(result.patrimoineNetAchatApresFiscalite), location: fmt(result.patrimoineNetLocationApresFiscalite), bold: true },
  ];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 mb-8">
      <h2 className="text-lg font-bold mb-4">📋 Détail des coûts</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 text-[var(--muted)]"></th>
              <th className="text-right py-2 text-[var(--accent)]">🏠 Achat</th>
              <th className="text-right py-2 text-[var(--green)]">📈 Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={`border-b border-[var(--border)] ${(r as any).bold ? "font-bold text-base" : ""} ${(r as any).fiscal ? "text-red-500" : ""}`}>
                <td className="py-2 text-[var(--muted)]">{r.label}</td>
                <td className={`py-2 text-right ${(r as any).fiscal ? "text-red-500" : ""}`}>{r.achat}</td>
                <td className={`py-2 text-right ${(r as any).fiscal ? "text-red-500" : ""}`}>{r.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
