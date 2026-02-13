"use client";
import { AchatParams } from "@/lib/types";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";
import { TAUX_ENDETTEMENT_MAX } from "@/lib/constants";

interface Props {
  params: AchatParams;
  result: SimulationResult;
  revenusMensuels: number;
  chargesCredits: number;
  onChange: (updates: Partial<AchatParams>) => void;
}

function Field({ label, value, onChange, min, max, step, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="mb-4">
      <label className="flex justify-between text-sm mb-1">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="font-medium">{suffix === "€" ? fmt(value) : `${value}${suffix || ""}`}</span>
      </label>
      <input
        type="range"
        className="w-full"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function AchatCard({ params, result, revenusMensuels, chargesCredits, onChange }: Props) {
  // Calculs du taux d'endettement (uniquement mensualité crédit + assurance emprunteur)
  const mensualiteCredit = result.mensualiteCreditMensuel + result.assuranceEmprunteurMensuel;
  const totalCredits = mensualiteCredit + chargesCredits;
  const tauxEndettement = (totalCredits / revenusMensuels) * 100;
  const capaciteMax = revenusMensuels * TAUX_ENDETTEMENT_MAX;
  const montantMaxEmpruntable = capaciteMax - chargesCredits;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        🏠 Scénario Achat
      </h2>
      <p className="text-xs text-[var(--muted)] mb-4">
        Votre capacité d&apos;endettement est utilisée au maximum pour financer le bien.
      </p>

      <Field label="Prix du bien" value={params.prixBien} onChange={(v) => onChange({ prixBien: v })}
        min={50000} max={1000000} step={5000} suffix="€" />
      <Field label="Apport personnel" value={params.apport} onChange={(v) => onChange({ apport: v })}
        min={0} max={params.prixBien} step={1000} suffix="€" />
      <Field label="Taux crédit" value={params.tauxCredit} onChange={(v) => onChange({ tauxCredit: v })}
        min={0.5} max={7} step={0.1} suffix="%" />

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Durée crédit</span>
          <span className="font-medium">{params.dureeCredit} ans</span>
        </label>
        <div className="flex gap-2">
          {[15, 20, 25].map((d) => (
            <button key={d}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                params.dureeCredit === d
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--card2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => onChange({ dureeCredit: d })}
            >
              {d} ans
            </button>
          ))}
        </div>
      </div>

      <Field label="Surface" value={params.surface} onChange={(v) => onChange({ surface: v })}
        min={10} max={200} step={1} suffix=" m²" />

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Type de bien</span>
        </label>
        <div className="flex gap-2">
          {[false, true].map((isNeuf) => (
            <button key={String(isNeuf)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                params.isNeuf === isNeuf
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--card2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              onClick={() => onChange({ isNeuf })}
            >
              {isNeuf ? "Neuf (3%)" : "Ancien (8%)"}
            </button>
          ))}
        </div>
      </div>

      <Field label="Revalorisation annuelle" value={params.tauxRevalorisation}
        onChange={(v) => onChange({ tauxRevalorisation: v })}
        min={-2} max={6} step={0.5} suffix="%" />

      {/* Résumé calculé */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-[var(--muted)]">Frais de notaire</span><span>{fmt(result.fraisNotaire)}</span></div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Mensualité crédit</span>
          <span className="font-semibold text-[var(--accent)]">{fmt(result.mensualiteCredit)}/mois</span>
        </div>

        {/* Détail coût mensuel */}
        <div className="bg-white/5 rounded-lg p-2.5 space-y-1.5 mt-2">
          <p className="text-[11px] font-medium text-[var(--muted)]">Coût mensuel total : {fmt(result.coutMensuelTotalAchat)}/mois</p>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--muted)]">Mensualité crédit</span>
            <span>{fmt(result.mensualiteCreditMensuel)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--muted)]">Assurance emprunteur</span>
            <span>{fmt(result.assuranceEmprunteurMensuel)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--muted)]">Taxe foncière</span>
            <span>{fmt(result.taxeFonciereMensuel)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--muted)]">Charges copropriété</span>
            <span>{fmt(result.chargesCoproMensuel)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--muted)]">Assurance PNO</span>
            <span>{fmt(result.assurancePNOMensuel)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--muted)]">Entretien / travaux</span>
            <span>{fmt(result.entretienMensuel)}</span>
          </div>
        </div>

        {/* Taux d'endettement */}
        <div className={`border rounded-lg p-2.5 mt-2 ${
          tauxEndettement > 35 
            ? "bg-red-500/10 border-red-500/20" 
            : tauxEndettement > 30 
            ? "bg-orange-500/10 border-orange-500/20"
            : "bg-[var(--green)]/10 border-[var(--green)]/20"
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Taux d&apos;endettement</span>
            <span className={`text-lg font-bold ${
              tauxEndettement > 35 ? "text-red-500" : tauxEndettement > 30 ? "text-orange-500" : "text-[var(--green)]"
            }`}>
              {tauxEndettement.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Mensualité crédit + assurance:</span>
              <span>{fmt(mensualiteCredit)}</span>
            </div>
            {chargesCredits > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Charges crédits existants:</span>
                <span>{fmt(chargesCredits)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-current/20 pt-1">
              <span className="font-medium">Total crédits:</span>
              <span className="font-bold">{fmt(totalCredits)}</span>
            </div>
          </div>
          {tauxEndettement > 35 && (
            <div className="mt-2 text-xs text-red-500">
              ⚠️ Taux d&apos;endettement dépassé. Réduisez le prix du bien ou augmentez l&apos;apport.
            </div>
          )}
          <div className="mt-2 text-xs text-[var(--muted)]">
            Capacité maximale : {fmt(montantMaxEmpruntable)}/mois
          </div>
        </div>

        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg p-2.5 mt-2">
          <p className="text-[10px] text-[var(--muted)]">
            💡 <strong className="text-[var(--accent)]">Capacité d&apos;endettement : {fmt(result.coutMensuelTotalAchat)}/mois</strong> — C&apos;est ce montant total qui sera comparé au loyer dans le scénario location.
          </p>
        </div>
      </div>
    </div>
  );
}
