"use client";
import { useState } from "react";
import { SimulationParams } from "@/lib/types";
import { encodeParams } from "@/lib/shareUrl";

interface Props {
  params: SimulationParams;
}

export default function ShareButton({ params }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const query = encodeParams(params);
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleShare}
      className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white px-6 py-3 rounded-xl font-medium transition-all cta-pulse"
    >
      {copied ? "✅ Lien copié !" : "🔗 Partager cette simulation"}
    </button>
  );
}
