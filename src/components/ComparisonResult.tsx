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
      <Row label="Patrimoine brut final" achat={fmt(result.patrimoineNetAchat)} location={fmt(result.patrimoineNetLocation)} />
      <Row label="Patrimoine net après fiscalité" achat={fmt(result.patrimoineNetAchatApresFiscalite)} location={fmt(result.patrimoineNetLocationApresFiscalite)} highlight />

      <div className="grid grid-cols-3 gap-4 py-3 text-sm">
        <span className="text-[var(--muted)]">Différence (net)</span>
        <span className="col-span-2 text-center font-bold text-[var(--orange)]">
          {fmt(Math.abs(result.patrimoineNetAchatApresFiscalite - result.patrimoineNetLocationApresFiscalite))} en faveur de {result.patrimoineNetAchatApresFiscalite > result.patrimoineNetLocationApresFiscalite ? "l'achat" : "la location"}
        </span>
      </div>

      {result.pointCroisement && (
        <p className="text-sm text-[var(--muted)] mt-2">
          📍 Point de croisement : après {Math.ceil(result.pointCroisement / 12)} ans ({result.pointCroisement} mois)
        </p>
      )}

      {/* Section fiscalité */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
        <h3 className="text-sm font-semibold text-[var(--muted)]">💸 Impact fiscal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[var(--card2)] rounded-lg p-3">
            <p className="font-medium text-[var(--accent)] mb-1">🏠 Achat - Plus-value immobilière</p>
            {result.taxCalculation.plusValueImmobiliere.isExoneree ? (
              <p className="text-[var(--green)]">✓ Exonérée (résidence principale)</p>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Plus-value :</span>
                  <span>{fmt(result.taxCalculation.plusValueImmobiliere.plusValueBrute)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impôt total (36.2%) :</span>
                  <span className="text-red-500">{fmt(result.taxCalculation.plusValueImmobiliere.impotTotal)}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-[var(--card2)] rounded-lg p-3">
            <p className="font-medium text-[var(--green)] mb-1">📈 Location - Flat tax 30%</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Gains totaux :</span>
                <span>{fmt(result.taxCalculation.flatTaxInvestissement.gainsAV + result.taxCalculation.flatTaxInvestissement.gainsPER + result.taxCalculation.flatTaxInvestissement.gainsSCPI)}</span>
              </div>
              <div className="flex justify-between">
                <span>Flat tax :</span>
                <span className="text-red-500">{fmt(result.taxCalculation.flatTaxInvestissement.taxeTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
