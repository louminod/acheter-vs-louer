"use client";
import { LocationParams, SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";
import { getInvestmentStrategy, getRendementBlended, getScpiCreditDetails } from "@/lib/simulation";

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

      {/* Stratégie d'investissement blended */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          🎯 Stratégie d&apos;investissement
        </h3>
        <StrategyDisplay investissementMensuel={result.investissementMensuel} />
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
            💡 Chaque mois, la différence entre le coût de l&apos;achat ({fmt(coutMensuelAchat)}) et votre loyer ({fmt(params.loyerMensuel)}) est répartie selon une stratégie d&apos;investissement diversifiée. L&apos;apport de {fmt(params.apportInvesti)} est également réparti dès le départ.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Affiche la stratégie d'investissement blended avec détails
 */
function StrategyDisplay({ investissementMensuel }: { investissementMensuel: number }) {
  const strategy = getInvestmentStrategy();
  const rendementBlended = getRendementBlended();
  
  let scpiCredit;
  try {
    scpiCredit = getScpiCreditDetails(investissementMensuel);
  } catch (error) {
    // Si calcul impossible (dividendes > mensualité), on affiche une version simplifiée
    scpiCredit = null;
  }

  return (
    <div className="space-y-2">
      {/* Rendement blended en évidence */}
      <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg p-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Rendement blended moyen</span>
          <span className="text-lg font-bold text-[var(--accent)]">{rendementBlended.toFixed(1)}%</span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">
          Calculé automatiquement selon la répartition ci-dessous
        </p>
      </div>

      {/* Détail des enveloppes */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Assurance Vie */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">Assurance Vie</span>
            <span className="text-[var(--muted)]">{strategy.assuranceVie.allocation}%</span>
          </div>
          <div className="text-[var(--muted)]">
            {fmt(investissementMensuel * strategy.assuranceVie.allocation / 100)}/mois
          </div>
          <div className="text-[var(--green)] font-medium">{strategy.assuranceVie.rendement}% net</div>
        </div>

        {/* PER */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">PER</span>
            <span className="text-[var(--muted)]">{strategy.per.allocation}%</span>
          </div>
          <div className="text-[var(--muted)]">
            {fmt(investissementMensuel * strategy.per.allocation / 100)}/mois
          </div>
          <div className="text-[var(--green)] font-medium">{strategy.per.rendement}% net</div>
        </div>

        {/* SCPI Cash */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">SCPI Cash</span>
            <span className="text-[var(--muted)]">{strategy.scpiCash.allocation}%</span>
          </div>
          <div className="text-[var(--muted)]">
            {fmt(investissementMensuel * strategy.scpiCash.allocation / 100)}/mois
          </div>
          <div className="text-[var(--green)] font-medium">
            {(strategy.scpiCash.rendementDividendes + strategy.scpiCash.rendementRevalo).toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--muted)]">
            {strategy.scpiCash.rendementDividendes}% div. + {strategy.scpiCash.rendementRevalo}% revalo
          </div>
        </div>

        {/* SCPI Crédit */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">SCPI Crédit</span>
            <span className="text-[var(--muted)]">{strategy.scpiCredit.allocation}%</span>
          </div>
          <div className="text-[var(--muted)]">
            {fmt(investissementMensuel * strategy.scpiCredit.allocation / 100)}/mois
          </div>
          {scpiCredit ? (
            <>
              <div className="text-[var(--green)] font-medium">
                {(strategy.scpiCredit.rendementDividendes + strategy.scpiCredit.rendementRevalo).toFixed(1)}%*
              </div>
              <div className="text-[10px] text-[var(--muted)]">
                Emprunt: {fmt(scpiCredit.montantEmprunte)}
              </div>
            </>
          ) : (
            <div className="text-orange-500 text-[10px]">Calcul non viable</div>
          )}
        </div>
      </div>

      {/* Détails SCPI Crédit */}
      {scpiCredit && (
        <div className="bg-[var(--muted)]/5 border border-[var(--border)] rounded-lg p-2 mt-2">
          <h4 className="text-xs font-medium mb-2">📊 Détails SCPI Crédit</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[var(--muted)]">Montant emprunté:</span>
              <div className="font-medium">{fmt(scpiCredit.montantEmprunte)}</div>
            </div>
            <div>
              <span className="text-[var(--muted)]">Mensualité crédit:</span>
              <div className="font-medium">{fmt(scpiCredit.mensualiteCredit)}</div>
            </div>
            <div>
              <span className="text-[var(--muted)]">Dividendes SCPI:</span>
              <div className="font-medium">{fmt(scpiCredit.dividendesMensuels)}</div>
            </div>
            <div>
              <span className="text-[var(--muted)]">Effort net:</span>
              <div className="font-medium text-[var(--accent)]">{fmt(scpiCredit.effortNet)}</div>
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-2 italic">
            * Deux phases: effort réduit pendant {strategy.scpiCredit.dureeCreditAns} ans, puis dividendes libérés
          </div>
        </div>
      )}
    </div>
  );
}
