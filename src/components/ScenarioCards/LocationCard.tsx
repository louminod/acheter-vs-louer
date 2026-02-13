"use client";
import { LocationParams } from "@/lib/types";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";

interface Props {
  params: LocationParams;
  result: SimulationResult;
  apport: number;
  onChange: (updates: Partial<LocationParams>) => void;
  horizonAns: number;
  onHorizonChange: (v: number) => void;
}

export default function LocationCard({ params, result, apport, onChange, horizonAns, onHorizonChange }: Props) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        📈 Scénario Location + Investissement
      </h2>

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Loyer mensuel</span>
          <span className="font-medium">{fmt(params.loyerMensuel)}/mois</span>
        </label>
        <input type="range" className="w-full" min={300} max={3000} step={25}
          value={params.loyerMensuel}
          onChange={(e) => onChange({ loyerMensuel: Number(e.target.value) })} />
      </div>

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Augmentation annuelle loyer</span>
          <span className="font-medium">{params.augmentationLoyer}%</span>
        </label>
        <input type="range" className="w-full" min={0} max={5} step={0.5}
          value={params.augmentationLoyer}
          onChange={(e) => onChange({ augmentationLoyer: Number(e.target.value) })} />
      </div>

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Rendement placement net</span>
          <span className="font-medium">{params.rendementPlacement}%</span>
        </label>
        <input type="range" className="w-full" min={2} max={8} step={0.5}
          value={params.rendementPlacement}
          onChange={(e) => onChange({ rendementPlacement: Number(e.target.value) })} />
      </div>

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Horizon de comparaison</span>
          <span className="font-medium">{horizonAns} ans</span>
        </label>
        <input type="range" className="w-full" min={5} max={40} step={1}
          value={horizonAns}
          onChange={(e) => onHorizonChange(Number(e.target.value))} />
      </div>

      {/* Résumé calculé */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Apport investi dès le départ</span>
          <span>{fmt(apport)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Investissement mensuel</span>
          <span className="font-semibold text-[var(--green)]">{fmt(result.investissementMensuel)}/mois</span>
        </div>
        <p className="text-xs text-[var(--muted)] italic">
          Soit la différence entre le coût mensuel de l&apos;achat ({fmt(result.coutMensuelTotalAchat)}) et votre loyer ({fmt(params.loyerMensuel)})
        </p>
      </div>
    </div>
  );
}
