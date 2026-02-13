"use client";
import { fmt } from "@/lib/formatters";
import { TAUX_ENDETTEMENT_MAX } from "@/lib/constants";

interface Props {
  revenusMensuels: number;
  chargesCredits: number;
  onChange: (updates: { revenusMensuels?: number; chargesCredits?: number }) => void;
}

export default function ProfileSection({ revenusMensuels, chargesCredits, onChange }: Props) {
  const capaciteEndettementMax = revenusMensuels * TAUX_ENDETTEMENT_MAX;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 mb-8">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        📋 Votre situation
      </h2>
      <p className="text-xs text-[var(--muted)] mb-4">
        Ces informations servent à calculer votre capacité d&apos;endettement pour les deux scénarios.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="flex justify-between text-sm mb-1">
            <span className="text-[var(--muted)]">Revenus mensuels nets</span>
            <span className="font-medium">{fmt(revenusMensuels)}/mois</span>
          </label>
          <input 
            type="range" 
            className="w-full" 
            min={1000} 
            max={10000} 
            step={100}
            value={revenusMensuels}
            onChange={(e) => onChange({ revenusMensuels: Number(e.target.value) })} 
          />
        </div>

        <div>
          <label className="flex justify-between text-sm mb-1">
            <span className="text-[var(--muted)]">Charges de crédits existants</span>
            <span className="font-medium">{fmt(chargesCredits)}/mois</span>
          </label>
          <input 
            type="range" 
            className="w-full" 
            min={0} 
            max={3000} 
            step={50}
            value={chargesCredits}
            onChange={(e) => onChange({ chargesCredits: Number(e.target.value) })} 
          />
        </div>
      </div>

      <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Capacité d&apos;endettement max (35% HCSF)</span>
          <span className="text-lg font-bold text-[var(--accent)]">{fmt(capaciteEndettementMax)}/mois</span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">
          Montant maximum que vous pouvez consacrer aux remboursements de crédits selon les règles bancaires.
        </p>
      </div>
    </div>
  );
}