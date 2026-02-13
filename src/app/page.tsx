"use client";
import { useSimulation } from "@/hooks/useSimulation";
import Hero from "@/components/Hero";
import AchatCard from "@/components/ScenarioCards/AchatCard";
import LocationCard from "@/components/ScenarioCards/LocationCard";
import ComparisonResult from "@/components/ComparisonResult";
import PatrimoineChart from "@/components/PatrimoineChart";
import DetailTable from "@/components/DetailTable";
import CostBreakdown from "@/components/CostBreakdown";
import ShareButton from "@/components/ShareButton";

export default function Home() {
  const { params, result, updateAchat, updateLocation, setHorizon } = useSimulation();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <Hero result={result} horizonAns={params.horizonAns} onHorizonChange={setHorizon} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AchatCard params={params.achat} result={result} onChange={updateAchat} />
        <LocationCard
          params={params.location}
          result={result}
          coutMensuelAchat={result.coutMensuelTotalAchat}
          horizonAns={params.horizonAns}
          onChange={updateLocation}
        />
      </div>

      <ComparisonResult result={result} horizonAns={params.horizonAns} />
      <PatrimoineChart result={result} dureeCredit={params.achat.dureeCredit} />
      <CostBreakdown result={result} />
      <DetailTable result={result} prixBien={params.achat.prixBien} />

      <div className="text-center mb-12">
        <ShareButton params={params} />
      </div>

      <footer className="text-center text-xs text-[var(--muted)] border-t border-[var(--border)] pt-6 pb-8 space-y-2">
        <p>
          Ce simulateur est fourni à titre informatif uniquement. Il ne constitue pas un conseil financier,
          fiscal ou juridique. Les résultats sont des estimations basées sur des hypothèses simplifiées.
        </p>
        <p>
          Les taux, rendements et frais réels peuvent varier significativement selon votre situation personnelle,
          la localisation du bien et les conditions de marché.
        </p>
        <p>Consultez un professionnel avant toute décision d&apos;investissement immobilier.</p>
      </footer>
    </main>
  );
}
