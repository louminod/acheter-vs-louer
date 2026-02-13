"use client";
import { LocationParams } from "@/lib/types";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";

interface Props {
  params: LocationParams;
  result: SimulationResult;
  coutMensuelAchat: number;
  onChange: (updates: Partial<LocationParams>) => void;
}

export default function LocationCard({ params, result, coutMensuelAchat, onChange }: Props) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        📈 Scénario Location + Investissement
      </h2>
      <p className="text-xs text-[var(--muted)] mb-4">
        Vous louez et investissez la différence entre votre capacité d&apos;endettement et le loyer.
      </p>

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Apport investi dès le départ</span>
          <span className="font-medium">{fmt(params.apportInvesti)}</span>
        </label>
        <input type="range" className="w-full" min={0} max={200000} step={1000}
          value={params.apportInvesti}
          onChange={(e) => onChange({ apportInvesti: Number(e.target.value) })} />
      </div>

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

      {/* Résumé calculé */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Coût mensuel achat (capacité)</span>
          <span>{fmt(coutMensuelAchat)}/mois</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Loyer</span>
          <span>- {fmt(params.loyerMensuel)}/mois</span>
        </div>
        <div className="flex justify-between border-t border-[var(--border)] pt-2">
          <span className="font-medium">Investissement mensuel</span>
          <span className="font-bold text-[var(--green)]">{fmt(result.investissementMensuel)}/mois</span>
        </div>
        <div className="bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-lg p-2.5">
          <p className="text-[10px] text-[var(--muted)]">
            💡 Chaque mois, la différence entre le coût de l&apos;achat ({fmt(coutMensuelAchat)}) et votre loyer ({fmt(params.loyerMensuel)}) est placée à {params.rendementPlacement}% net. L&apos;apport de {fmt(params.apportInvesti)} est également investi dès le départ.
          </p>
        </div>
      </div>
    </div>
  );
}
