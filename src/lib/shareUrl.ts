import { SimulationParams } from "./types";
import { DEFAULTS } from "./constants";

const KEYS = [
  "px", "ap", "tc", "dc", "sf", "nf", "rv",
  "ly", "al", "ai", "hz",
] as const;

export function encodeParams(p: SimulationParams): string {
  const vals = [
    p.achat.prixBien, p.achat.apport, p.achat.tauxCredit, p.achat.dureeCredit,
    p.achat.surface, p.achat.isNeuf ? 1 : 0, p.achat.tauxRevalorisation,
    p.location.loyerMensuel, p.location.augmentationLoyer,
    p.location.apportInvesti, p.horizonAns,
  ];
  const parts = KEYS.map((k, i) => `${k}=${vals[i]}`);
  return parts.join("&");
}

export function decodeParams(search: string): Partial<SimulationParams> | null {
  if (!search) return null;
  const sp = new URLSearchParams(search);
  const g = (k: string) => sp.has(k) ? Number(sp.get(k)) : undefined;

  const px = g("px"), ap = g("ap"), tc = g("tc"), dc = g("dc");
  const sf = g("sf"), nf = g("nf"), rv = g("rv");
  const ly = g("ly"), al = g("al"), ai = g("ai"), hz = g("hz");

  if (px === undefined) return null;

  return {
    achat: {
      prixBien: px ?? DEFAULTS.prixBien,
      apport: ap ?? DEFAULTS.apport,
      tauxCredit: tc ?? DEFAULTS.tauxCredit,
      dureeCredit: dc ?? DEFAULTS.dureeCredit,
      surface: sf ?? DEFAULTS.surface,
      isNeuf: nf === 1,
      tauxRevalorisation: rv ?? DEFAULTS.tauxRevalorisation,
    },
    location: {
      loyerMensuel: ly ?? px * 0.004,
      augmentationLoyer: al ?? DEFAULTS.augmentationLoyer,
      apportInvesti: ai ?? ap ?? DEFAULTS.apport,
      // rendementPlacement supprimé - maintenant calculé automatiquement
    },
    horizonAns: hz ?? DEFAULTS.horizonAns,
  };
}
