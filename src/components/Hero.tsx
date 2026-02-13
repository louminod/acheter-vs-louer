"use client";
import { SimulationResult } from "@/lib/types";
import { fmt } from "@/lib/formatters";

interface Props {
  result: SimulationResult;
  horizonAns: number;
}

export default function Hero({ result, horizonAns }: Props) {
  const achatWins = result.patrimoineNetAchat > result.patrimoineNetLocation;
  const diff = Math.abs(result.patrimoineNetAchat - result.patrimoineNetLocation);

  return (
    <div className="hero-gradient rounded-2xl p-6 md:p-10 mb-8 text-center">
      <h1 className="text-2xl md:text-4xl font-bold mb-2">
        Acheter ou Louer ?
      </h1>
      <p className="text-[var(--muted)] mb-8 text-sm md:text-base">
        Simulez les deux scénarios sur la durée et comparez votre patrimoine net
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={`rounded-xl p-6 border ${achatWins ? "border-[var(--green)] bg-[var(--green)]/5" : "border-[var(--border)] bg-[var(--card)]"}`}>
          <div className="text-sm text-[var(--muted)] mb-1">🏠 En achetant</div>
          <div className="text-2xl md:text-3xl font-bold animate-in">
            {fmt(result.patrimoineNetAchat)}
          </div>
          <div className="text-sm text-[var(--muted)]">après {horizonAns} ans</div>
        </div>
        <div className={`rounded-xl p-6 border ${!achatWins ? "border-[var(--green)] bg-[var(--green)]/5" : "border-[var(--border)] bg-[var(--card)]"}`}>
          <div className="text-sm text-[var(--muted)] mb-1">📈 En louant + investissant</div>
          <div className="text-2xl md:text-3xl font-bold animate-in">
            {fmt(result.patrimoineNetLocation)}
          </div>
          <div className="text-sm text-[var(--muted)]">après {horizonAns} ans</div>
        </div>
      </div>

      <div className={`inline-block rounded-full px-6 py-3 font-semibold text-lg ${achatWins ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--green)]/20 text-[var(--green)]"}`}>
        {achatWins ? "🏠 L'achat" : "📈 La location + investissement"} est plus avantageux de {fmt(diff)}
      </div>
    </div>
  );
}
