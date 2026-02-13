"use client";
import { useState, useMemo, useEffect } from "react";
import { SimulationParams, SimulationResult } from "@/lib/types";
import { DEFAULTS, RATIO_LOYER_PRIX } from "@/lib/constants";
import { runSimulation } from "@/lib/simulation";
import { decodeParams } from "@/lib/shareUrl";

export function useSimulation() {
  const [params, setParams] = useState<SimulationParams>(() => ({
    achat: {
      prixBien: DEFAULTS.prixBien,
      apport: DEFAULTS.apport,
      tauxCredit: DEFAULTS.tauxCredit,
      dureeCredit: DEFAULTS.dureeCredit,
      surface: DEFAULTS.surface,
      isNeuf: DEFAULTS.isNeuf,
      tauxRevalorisation: DEFAULTS.tauxRevalorisation,
    },
    location: {
      loyerMensuel: Math.round(DEFAULTS.prixBien * RATIO_LOYER_PRIX),
      augmentationLoyer: DEFAULTS.augmentationLoyer,
      rendementPlacement: DEFAULTS.rendementPlacement,
      apportInvesti: DEFAULTS.apport,
    },
    horizonAns: DEFAULTS.horizonAns,
  }));

  // Load from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const decoded = decodeParams(window.location.search);
    if (decoded) {
      setParams((prev) => ({ ...prev, ...decoded } as SimulationParams));
    }
  }, []);

  const result: SimulationResult = useMemo(() => runSimulation(params), [params]);

  const updateAchat = (updates: Partial<SimulationParams["achat"]>) => {
    setParams((p) => ({ ...p, achat: { ...p.achat, ...updates } }));
  };

  const updateLocation = (updates: Partial<SimulationParams["location"]>) => {
    setParams((p) => ({ ...p, location: { ...p.location, ...updates } }));
  };

  const setHorizon = (horizonAns: number) => {
    setParams((p) => ({ ...p, horizonAns }));
  };

  return { params, result, updateAchat, updateLocation, setHorizon, setParams };
}
